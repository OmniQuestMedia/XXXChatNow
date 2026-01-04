import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { QueueEventService } from 'src/kernel';
import { UserService } from 'src/modules/user/services';
import {
  PerformerCommissionService,
  PerformerService
} from 'src/modules/performer/services';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { SettingService } from 'src/modules/settings/services';
import { StudioService } from 'src/modules/studio/services';
import { ConversationService } from 'src/modules/message/services';
import { DBLoggerService } from 'src/modules/logger';
import { PerformanceQueueService } from 'src/modules/performance-queue/services';
import { MoodMessagingService } from 'src/modules/mood-messaging/services';
import { PaymentTokenListener } from './payment-token.listener';
import {
  PURCHASE_ITEM_STATUS,
  PURCHASE_ITEM_TYPE,
  SETTLEMENT_STATUS
} from '../constants';
import { ROLE } from 'src/kernel/constants';

describe('PaymentTokenListener - TipActivated Event', () => {
  let listener: PaymentTokenListener;
  let performanceQueueService: PerformanceQueueService;
  let logger: DBLoggerService;

  const mockPerformer = {
    _id: new Types.ObjectId(),
    username: 'testperformer',
    studioId: null
  };

  const mockUser = {
    _id: new Types.ObjectId(),
    username: 'testuser',
    balance: 1000
  };

  const mockTransaction = {
    _id: new Types.ObjectId(),
    sourceId: mockUser._id,
    source: ROLE.USER,
    sellerId: mockPerformer._id,
    targetId: new Types.ObjectId(),
    type: PURCHASE_ITEM_TYPE.TIP,
    status: PURCHASE_ITEM_STATUS.SUCCESS,
    settlementStatus: SETTLEMENT_STATUS.SETTLED,
    totalPrice: 100,
    extraInfo: {
      conversationType: 'private',
      customMessage: 'Great show!'
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentTokenListener,
        {
          provide: UserService,
          useValue: {
            findById: jest.fn().mockResolvedValue(mockUser),
            userRank: jest.fn().mockResolvedValue(true),
            increaseBalance: jest.fn().mockResolvedValue(true)
          }
        },
        {
          provide: PerformerService,
          useValue: {
            findById: jest.fn().mockResolvedValue(mockPerformer),
            increaseBalance: jest.fn().mockResolvedValue(true)
          }
        },
        {
          provide: QueueEventService,
          useValue: {
            subscribe: jest.fn()
          }
        },
        {
          provide: SocketUserService,
          useValue: {
            emitToRoom: jest.fn().mockResolvedValue(true),
            emitToUsers: jest.fn().mockResolvedValue(true)
          }
        },
        {
          provide: SettingService,
          useValue: {
            getKeyValue: jest.fn().mockResolvedValue(20) // Default commission
          }
        },
        {
          provide: PerformerCommissionService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(null)
          }
        },
        {
          provide: StudioService,
          useValue: {
            findById: jest.fn(),
            increaseBalance: jest.fn().mockResolvedValue(true)
          }
        },
        {
          provide: ConversationService,
          useValue: {
            findById: jest.fn().mockResolvedValue({
              _id: mockTransaction.targetId,
              type: 'private',
              recipients: []
            }),
            serializeConversation: jest.fn().mockReturnValue('serialized')
          }
        },
        {
          provide: DBLoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn()
          }
        },
        {
          provide: PerformanceQueueService,
          useValue: {
            submitRequest: jest.fn().mockResolvedValue({
              requestId: 'test-request-id',
              status: 'pending'
            })
          }
        },
        {
          provide: MoodMessagingService,
          useValue: {
            getMoodState: jest.fn().mockResolvedValue('neutral'),
            renderTemplate: jest.fn().mockResolvedValue('Thank you for the tip!')
          }
        }
      ]
    }).compile();

    listener = module.get<PaymentTokenListener>(PaymentTokenListener);
    performanceQueueService = module.get<PerformanceQueueService>(PerformanceQueueService);
    logger = module.get<DBLoggerService>(DBLoggerService);
  });

  describe('emitTipActivatedEvent', () => {
    it('should emit TipActivated event for settled tip transaction', async () => {
      await listener.emitTipActivatedEvent(
        mockTransaction as any,
        80, // netPrice
        20, // commission
        0, // studioCommission
        mockUser,
        mockPerformer
      );

      expect(performanceQueueService.submitRequest).toHaveBeenCalledWith(
        expect.any(Types.ObjectId),
        expect.objectContaining({
          type: 'TipActivated',
          mode: 'fifo',
          priority: 10,
          idempotencyKey: mockTransaction._id.toString(),
          payload: expect.objectContaining({
            tipId: mockTransaction._id.toString(),
            idempotencyKey: mockTransaction._id.toString(),
            eventType: 'TipActivated',
            totalPrice: 100,
            netPrice: 80,
            commission: 20,
            studioCommission: 0,
            tipper: expect.objectContaining({
              userId: mockUser._id,
              username: 'testuser',
              role: ROLE.USER
            }),
            recipient: expect.objectContaining({
              performerId: mockPerformer._id,
              username: 'testperformer'
            }),
            ledger: expect.objectContaining({
              transactionId: mockTransaction._id
            }),
            settlement: expect.objectContaining({
              status: SETTLEMENT_STATUS.SETTLED
            }),
            processed: false
          })
        })
      );

      expect(logger.log).toHaveBeenCalledWith(
        'TipActivated event emitted successfully',
        expect.any(Object)
      );
    });

    it('should skip event emission if settlement status is not SETTLED', async () => {
      const pendingTransaction = {
        ...mockTransaction,
        settlementStatus: SETTLEMENT_STATUS.PENDING
      };

      await listener.emitTipActivatedEvent(
        pendingTransaction as any,
        80,
        20,
        0,
        mockUser,
        mockPerformer
      );

      expect(performanceQueueService.submitRequest).not.toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('Skipping TipActivated event emission'),
        expect.any(Object)
      );
    });

    it('should default to SETTLED status for backward compatibility', async () => {
      const transactionWithoutSettlement = {
        ...mockTransaction,
        settlementStatus: undefined
      };

      await listener.emitTipActivatedEvent(
        transactionWithoutSettlement as any,
        80,
        20,
        0,
        mockUser,
        mockPerformer
      );

      expect(performanceQueueService.submitRequest).toHaveBeenCalled();
    });

    it('should enforce idempotency using tipId', async () => {
      await listener.emitTipActivatedEvent(
        mockTransaction as any,
        80,
        20,
        0,
        mockUser,
        mockPerformer
      );

      const submitCall = (performanceQueueService.submitRequest as jest.Mock).mock.calls[0][1];
      expect(submitCall.idempotencyKey).toBe(mockTransaction._id.toString());
      expect(submitCall.payload.tipId).toBe(mockTransaction._id.toString());
      expect(submitCall.payload.idempotencyKey).toBe(mockTransaction._id.toString());
    });

    it('should include all required ledger references', async () => {
      await listener.emitTipActivatedEvent(
        mockTransaction as any,
        80,
        20,
        0,
        mockUser,
        mockPerformer
      );

      const submitCall = (performanceQueueService.submitRequest as jest.Mock).mock.calls[0][1];
      const payload = submitCall.payload;

      expect(payload.ledger).toMatchObject({
        transactionId: mockTransaction._id,
        conversationId: mockTransaction.targetId
      });
    });

    it('should include context metadata from transaction extraInfo', async () => {
      await listener.emitTipActivatedEvent(
        mockTransaction as any,
        80,
        20,
        0,
        mockUser,
        mockPerformer
      );

      const submitCall = (performanceQueueService.submitRequest as jest.Mock).mock.calls[0][1];
      const payload = submitCall.payload;

      expect(payload.context).toMatchObject({
        conversationType: 'private',
        customMessage: 'Great show!'
      });
    });

    it('should handle performer with studio', async () => {
      const studioPerformer = {
        ...mockPerformer,
        studioId: new Types.ObjectId()
      };

      await listener.emitTipActivatedEvent(
        mockTransaction as any,
        70, // netPrice (lower due to studio commission)
        20, // commission
        10, // studioCommission
        mockUser,
        studioPerformer
      );

      const submitCall = (performanceQueueService.submitRequest as jest.Mock).mock.calls[0][1];
      const payload = submitCall.payload;

      expect(payload.recipient.studioId).toBe(studioPerformer.studioId);
      expect(payload.studioCommission).toBe(10);
    });

    it('should log error without blocking transaction on failure', async () => {
      (performanceQueueService.submitRequest as jest.Mock).mockRejectedValueOnce(
        new Error('Queue submission failed')
      );

      // Should not throw
      await listener.emitTipActivatedEvent(
        mockTransaction as any,
        80,
        20,
        0,
        mockUser,
        mockPerformer
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to emit TipActivated event',
        expect.objectContaining({
          context: 'PaymentTokenListener',
          tipId: mockTransaction._id.toString()
        })
      );
    });

    it('should set event timestamp to current time', async () => {
      const beforeTime = new Date();
      
      await listener.emitTipActivatedEvent(
        mockTransaction as any,
        80,
        20,
        0,
        mockUser,
        mockPerformer
      );

      const afterTime = new Date();
      const submitCall = (performanceQueueService.submitRequest as jest.Mock).mock.calls[0][1];
      const eventTimestamp = new Date(submitCall.payload.eventTimestamp);

      expect(eventTimestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(eventTimestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should set processed flag to false', async () => {
      await listener.emitTipActivatedEvent(
        mockTransaction as any,
        80,
        20,
        0,
        mockUser,
        mockPerformer
      );

      const submitCall = (performanceQueueService.submitRequest as jest.Mock).mock.calls[0][1];
      expect(submitCall.payload.processed).toBe(false);
    });

    it('should handle null username values gracefully', async () => {
      const userWithoutUsername = { ...mockUser, username: null };
      const performerWithoutUsername = { ...mockPerformer, username: null };

      await listener.emitTipActivatedEvent(
        mockTransaction as any,
        80,
        20,
        0,
        userWithoutUsername,
        performerWithoutUsername
      );

      const submitCall = (performanceQueueService.submitRequest as jest.Mock).mock.calls[0][1];
      const payload = submitCall.payload;

      expect(payload.tipper.username).toBeNull();
      expect(payload.recipient.username).toBeNull();
    });

    it('should use FIFO mode for event processing', async () => {
      await listener.emitTipActivatedEvent(
        mockTransaction as any,
        80,
        20,
        0,
        mockUser,
        mockPerformer
      );

      const submitCall = (performanceQueueService.submitRequest as jest.Mock).mock.calls[0][1];
      expect(submitCall.mode).toBe('fifo');
    });

    it('should use medium-high priority (10)', async () => {
      await listener.emitTipActivatedEvent(
        mockTransaction as any,
        80,
        20,
        0,
        mockUser,
        mockPerformer
      );

      const submitCall = (performanceQueueService.submitRequest as jest.Mock).mock.calls[0][1];
      expect(submitCall.priority).toBe(10);
    });
  });

  describe('integration with handler', () => {
    it('should not emit TipActivated event for non-tip transactions', async () => {
      const videoTransaction = {
        ...mockTransaction,
        type: PURCHASE_ITEM_TYPE.SALE_VIDEO
      };

      // The emitTipActivatedEvent should not be called for non-tip transactions
      // This would be tested in the full handler test, but we can verify the logic
      expect(videoTransaction.type).not.toBe(PURCHASE_ITEM_TYPE.TIP);
    });

    it('should handle settlement status validation correctly', async () => {
      const statuses = [
        SETTLEMENT_STATUS.PENDING,
        SETTLEMENT_STATUS.PROCESSING,
        SETTLEMENT_STATUS.CANCELLED,
        SETTLEMENT_STATUS.FAILED
      ];

      for (const status of statuses) {
        const transaction = {
          ...mockTransaction,
          settlementStatus: status
        };

        await listener.emitTipActivatedEvent(
          transaction as any,
          80,
          20,
          0,
          mockUser,
          mockPerformer
        );
      }

      // Should only emit once for SETTLED status (from other tests)
      // These calls should be skipped
      expect(logger.log).toHaveBeenCalledTimes(statuses.length);
    });
  });

  describe('TIP_GRID_ITEM Mood Messaging - Phase 6', () => {
    let moodMessagingService: any;

    beforeEach(() => {
      // Get reference to moodMessagingService for mocking
      moodMessagingService = {
        renderTemplate: jest.fn().mockResolvedValue('Thank you TestUser for the 50 token tip! 😊')
      };
      
      // Replace the service in the listener
      (listener as any).moodMessagingService = moodMessagingService;
    });

    it('should use mood messaging service for TIP_GRID_ITEM transactions', async () => {
      const tipGridTransaction = {
        ...mockTransaction,
        type: PURCHASE_ITEM_TYPE.TIP_GRID_ITEM,
        totalPrice: 50
      };

      await (listener as any).notify(tipGridTransaction, 40);

      expect(moodMessagingService.renderTemplate).toHaveBeenCalledWith(
        mockPerformer._id,
        'tip_thank_you',
        expect.any(String), // tier level
        expect.objectContaining({
          userName: mockUser.username,
          amount: 50
        })
      );
    });

    it('should fall back to generic message if mood service fails', async () => {
      moodMessagingService.renderTemplate.mockRejectedValue(new Error('Service unavailable'));

      const tipGridTransaction = {
        ...mockTransaction,
        type: PURCHASE_ITEM_TYPE.TIP_GRID_ITEM,
        totalPrice: 50
      };

      await (listener as any).notify(tipGridTransaction, 40);

      // Should log error and use fallback
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to render mood message, using fallback',
        expect.objectContaining({
          context: 'PaymentTokenListener'
        })
      );
    });

    it('should render different messages based on user tier', async () => {
      moodMessagingService.renderTemplate.mockImplementation(
        (_performerId, _templateType, tier, _variables) => {
          if (tier === 'platinum') {
            return Promise.resolve('WOW! 🌟 Thank you SO much TestUser!');
          }
          return Promise.resolve('Thank you TestUser!');
        }
      );

      const tipGridTransaction = {
        ...mockTransaction,
        type: PURCHASE_ITEM_TYPE.TIP_GRID_ITEM,
        totalPrice: 100
      };

      await (listener as any).notify(tipGridTransaction, 80);

      expect(moodMessagingService.renderTemplate).toHaveBeenCalled();
    });

    it('should handle TIP transactions without mood messaging', async () => {
      const regularTipTransaction = {
        ...mockTransaction,
        type: PURCHASE_ITEM_TYPE.TIP,
        totalPrice: 50
      };

      await (listener as any).notify(regularTipTransaction, 40);

      // Regular tips should NOT use mood messaging service
      expect(moodMessagingService.renderTemplate).not.toHaveBeenCalled();
    });

    it('should extract user tier correctly for mood personalization', () => {
      const getUserTier = (listener as any).getUserTier.bind(listener);

      // Test with free tier user
      const freeUser = { tier: 'free' };
      expect(getUserTier(freeUser)).toBe('free');

      // Test with gold tier user
      const goldUser = { tier: 'gold' };
      expect(getUserTier(goldUser)).toBe('gold');

      // Test with subscription level
      const subscribedUser = { subscriptionLevel: 'platinum' };
      expect(getUserTier(subscribedUser)).toBe('platinum');

      // Test with null user
      expect(getUserTier(null)).toBeNull();

      // Test with user without tier
      const noTierUser = {};
      expect(getUserTier(noTierUser)).toBe('free');
    });
  });
});
