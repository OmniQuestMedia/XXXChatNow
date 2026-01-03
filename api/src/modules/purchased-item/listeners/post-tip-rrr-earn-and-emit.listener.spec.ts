import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { RRRPointsService } from 'src/modules/loyalty-points/services';
import { PostTipRRREarnAndEmitListener } from './post-tip-rrr-earn-and-emit.listener';
import {
  PURCHASED_ITEM_SUCCESS_CHANNEL,
  PURCHASE_ITEM_TYPE,
  PURCHASE_ITEM_STATUS,
  TIP_ACTIVATED_CHANNEL
} from '../constants';
import { PurchasedItem, TipActivatedEventLog } from '../schemas';

// Mock QueueEventService to avoid importing kernel dependencies
const mockQueueEventService = {
  subscribe: jest.fn(),
  publish: jest.fn().mockResolvedValue(true)
};

// Mock QueueEvent class
class MockQueueEvent {
  channel: string;
  eventName: string;
  data: any;

  constructor(config: { channel: string; eventName: string; data: any }) {
    this.channel = config.channel;
    this.eventName = config.eventName;
    this.data = config.data;
  }
}

const EVENT = {
  CREATED: 'created'
};

describe('PostTipRRREarnAndEmitListener', () => {
  let listener: PostTipRRREarnAndEmitListener;
  let purchasedItemModel: any;
  let tipActivatedEventLogModel: any;
  let queueEventService: any;
  let rrrPointsService: RRRPointsService;

  const mockPurchasedItem = {
    _id: new ObjectId(),
    source: 'user',
    sourceId: new ObjectId(),
    target: 'tip',
    targetId: new ObjectId(),
    sellerId: new ObjectId(),
    type: PURCHASE_ITEM_TYPE.TIP,
    status: PURCHASE_ITEM_STATUS.SUCCESS,
    totalPrice: 100,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockEarnResponse = {
    status: 'POSTED',
    ledger_entry_id: 'entry-123',
    posted_at: '2026-01-03T04:00:00Z'
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostTipRRREarnAndEmitListener,
        {
          provide: getModelToken(PurchasedItem.name),
          useValue: {
            updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 })
          }
        },
        {
          provide: getModelToken(TipActivatedEventLog.name),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn()
          }
        },
        {
          provide: 'QueueEventService',
          useValue: mockQueueEventService
        },
        {
          provide: RRRPointsService,
          useValue: {
            earnFromTokenPurchase: jest.fn()
          }
        }
      ]
    }).compile();

    listener = module.get<PostTipRRREarnAndEmitListener>(PostTipRRREarnAndEmitListener);
    purchasedItemModel = module.get(getModelToken(PurchasedItem.name));
    tipActivatedEventLogModel = module.get(getModelToken(TipActivatedEventLog.name));
    queueEventService = module.get('QueueEventService');
    rrrPointsService = module.get<RRRPointsService>(RRRPointsService);
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  describe('handler', () => {
    it('should process tip purchase and emit TipActivated event', async () => {
      // Mock RRR response
      jest.spyOn(rrrPointsService, 'earnFromTokenPurchase').mockResolvedValue(mockEarnResponse);
      jest.spyOn(tipActivatedEventLogModel, 'findOne').mockResolvedValue(null);
      jest.spyOn(tipActivatedEventLogModel, 'create').mockResolvedValue({});

      const event = new MockQueueEvent({
        channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: mockPurchasedItem as any
      });

      await listener.handler(event);

      // Verify RRR earn event was posted
      expect(rrrPointsService.earnFromTokenPurchase).toHaveBeenCalledWith(
        mockPurchasedItem.sourceId,
        mockPurchasedItem._id.toString(),
        'USD',
        expect.any(Number),
        expect.any(Number),
        expect.stringContaining('earn_tip_'),
        expect.any(Object)
      );

      // Verify PurchasedItem was updated with RRR info
      expect(purchasedItemModel.updateOne).toHaveBeenCalledWith(
        { _id: mockPurchasedItem._id },
        expect.objectContaining({
          $set: expect.objectContaining({
            rrrLedgerEntryId: mockEarnResponse.ledger_entry_id,
            rrrSourceRef: `purchasedItem:${mockPurchasedItem._id.toString()}`,
            rrrPostedAt: expect.any(Date)
          })
        })
      );

      // Verify TipActivated event was emitted
      expect(queueEventService.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: TIP_ACTIVATED_CHANNEL,
          eventName: EVENT.CREATED,
          data: expect.objectContaining({
            tipId: mockPurchasedItem._id.toString(),
            ledgerEntryId: mockEarnResponse.ledger_entry_id,
            ledgerSourceRef: `purchasedItem:${mockPurchasedItem._id.toString()}`,
            ledgerPostedAt: mockEarnResponse.posted_at
          })
        })
      );
    });

    it('should not emit TipActivated if RRR entry is not posted', async () => {
      // Mock RRR response without posted_at
      const pendingResponse = {
        status: 'PENDING',
        ledger_entry_id: 'entry-456',
        posted_at: null
      };

      jest.spyOn(rrrPointsService, 'earnFromTokenPurchase').mockResolvedValue(pendingResponse);

      const event = new MockQueueEvent({
        channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: mockPurchasedItem as any
      });

      await listener.handler(event);

      // Verify PurchasedItem was updated
      expect(purchasedItemModel.updateOne).toHaveBeenCalled();

      // Verify TipActivated event was NOT emitted
      expect(queueEventService.publish).not.toHaveBeenCalled();
    });

    it('should prevent duplicate TipActivated emissions via unique index', async () => {
      jest.spyOn(rrrPointsService, 'earnFromTokenPurchase').mockResolvedValue(mockEarnResponse);
      jest.spyOn(tipActivatedEventLogModel, 'findOne').mockResolvedValue(null);

      // Simulate duplicate key error on second insert
      let insertAttempts = 0;
      jest.spyOn(tipActivatedEventLogModel, 'create').mockImplementation(() => {
        insertAttempts++;
        if (insertAttempts > 1) {
          const error: any = new Error('Duplicate key error');
          error.code = 11000;
          throw error;
        }
        return Promise.resolve({});
      });

      const event = new MockQueueEvent({
        channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: mockPurchasedItem as any
      });

      // First emission - should succeed
      await listener.handler(event);
      expect(queueEventService.publish).toHaveBeenCalledTimes(1);

      // Second emission - should be prevented by unique index
      await listener.handler(event);
      
      // Verify only one event was published despite two handler calls
      expect(queueEventService.publish).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent emissions and ensure only one event log exists', async () => {
      jest.spyOn(rrrPointsService, 'earnFromTokenPurchase').mockResolvedValue(mockEarnResponse);

      // Track event log insertions
      const eventLogs = new Set<string>();
      
      jest.spyOn(tipActivatedEventLogModel, 'findOne').mockImplementation((query: any) => {
        return Promise.resolve(eventLogs.has(query.tipId) ? { tipId: query.tipId } : null);
      });

      jest.spyOn(tipActivatedEventLogModel, 'create').mockImplementation((data: any) => {
        if (eventLogs.has(data.tipId)) {
          const error: any = new Error('Duplicate key error');
          error.code = 11000;
          throw error;
        }
        eventLogs.add(data.tipId);
        return Promise.resolve(data);
      });

      const event = new MockQueueEvent({
        channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: mockPurchasedItem as any
      });

      // Simulate concurrent handler calls
      await Promise.all([
        listener.handler(event),
        listener.handler(event),
        listener.handler(event)
      ]);

      // Verify only one event log entry exists
      const tipId = mockPurchasedItem._id.toString();
      expect(eventLogs.size).toBe(1);
      expect(eventLogs.has(tipId)).toBe(true);

      // Verify only one TipActivated event was published
      expect(queueEventService.publish).toHaveBeenCalledTimes(1);
    });

    it('should skip non-tip purchases', async () => {
      const nonTipPurchase = {
        ...mockPurchasedItem,
        type: PURCHASE_ITEM_TYPE.PRODUCT
      };

      const event = new MockQueueEvent({
        channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: nonTipPurchase as any
      });

      await listener.handler(event);

      // Verify no RRR call was made
      expect(rrrPointsService.earnFromTokenPurchase).not.toHaveBeenCalled();
      expect(queueEventService.publish).not.toHaveBeenCalled();
    });

    it('should skip non-success purchases', async () => {
      const pendingPurchase = {
        ...mockPurchasedItem,
        status: PURCHASE_ITEM_STATUS.PENDING
      };

      const event = new MockQueueEvent({
        channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: pendingPurchase as any
      });

      await listener.handler(event);

      // Verify no RRR call was made
      expect(rrrPointsService.earnFromTokenPurchase).not.toHaveBeenCalled();
      expect(queueEventService.publish).not.toHaveBeenCalled();
    });
  });
});
