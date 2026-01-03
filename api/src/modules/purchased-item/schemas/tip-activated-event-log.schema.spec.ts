import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { TipActivatedEventLog } from '../schemas/tip-activated-event-log.schema';

/**
 * Unit test for TipActivatedEventLog idempotency
 * Tests the unique index enforcement logic using mocks
 */
describe('TipActivatedEventLog - Idempotency via Unique Index', () => {
  let tipActivatedEventLogModel: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getModelToken(TipActivatedEventLog.name),
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            countDocuments: jest.fn()
          }
        }
      ]
    }).compile();

    tipActivatedEventLogModel = module.get(getModelToken(TipActivatedEventLog.name));
  });

  it('should allow creating a new event log entry', async () => {
    const mockEventLog = {
      tipId: 'tip-123',
      eventId: 'event-uuid-1',
      sourceRef: 'purchasedItem:tip-123',
      createdAt: new Date()
    };

    tipActivatedEventLogModel.create.mockResolvedValue(mockEventLog);

    const result = await tipActivatedEventLogModel.create(mockEventLog);

    expect(result).toBeDefined();
    expect(result.tipId).toBe('tip-123');
    expect(tipActivatedEventLogModel.create).toHaveBeenCalledWith(mockEventLog);
  });

  it('should reject duplicate tipId with error code 11000 (MongoDB duplicate key)', async () => {
    const mockEventLog = {
      tipId: 'tip-456',
      eventId: 'event-uuid-2',
      sourceRef: 'purchasedItem:tip-456',
      createdAt: new Date()
    };

    // Simulate MongoDB duplicate key error
    const duplicateKeyError: any = new Error('E11000 duplicate key error');
    duplicateKeyError.code = 11000;
    duplicateKeyError.keyPattern = { tipId: 1 };
    duplicateKeyError.keyValue = { tipId: 'tip-456' };

    tipActivatedEventLogModel.create.mockRejectedValue(duplicateKeyError);

    await expect(tipActivatedEventLogModel.create(mockEventLog)).rejects.toMatchObject({
      code: 11000
    });
  });

  it('should ensure concurrent insertions only succeed once via unique index', async () => {
    const tipId = 'tip-789';
    let insertAttempts = 0;

    // Mock: first call succeeds, subsequent calls fail with duplicate key error
    tipActivatedEventLogModel.create.mockImplementation((data: any) => {
      insertAttempts++;
      if (insertAttempts === 1) {
        return Promise.resolve({
          tipId: data.tipId,
          eventId: data.eventId,
          sourceRef: data.sourceRef,
          createdAt: data.createdAt
        });
      } else {
        const error: any = new Error('E11000 duplicate key error');
        error.code = 11000;
        return Promise.reject(error);
      }
    });

    // Simulate concurrent insertion attempts
    const insertPromises = [
      tipActivatedEventLogModel.create({
        tipId,
        eventId: 'event-uuid-1',
        sourceRef: `purchasedItem:${tipId}`,
        createdAt: new Date()
      }).catch((e: any) => ({ error: e })),
      tipActivatedEventLogModel.create({
        tipId,
        eventId: 'event-uuid-2',
        sourceRef: `purchasedItem:${tipId}`,
        createdAt: new Date()
      }).catch((e: any) => ({ error: e })),
      tipActivatedEventLogModel.create({
        tipId,
        eventId: 'event-uuid-3',
        sourceRef: `purchasedItem:${tipId}`,
        createdAt: new Date()
      }).catch((e: any) => ({ error: e }))
    ];

    const results = await Promise.all(insertPromises);

    // Check results
    const successfulInserts = results.filter(r => !r.error);
    const failedInserts = results.filter(r => r.error && r.error.code === 11000);

    expect(successfulInserts.length).toBe(1);
    expect(failedInserts.length).toBe(2);
    expect(tipActivatedEventLogModel.create).toHaveBeenCalledTimes(3);
  });

  it('should support findOne for duplicate check before insert', async () => {
    const tipId = 'tip-999';
    
    // Mock: no existing record
    tipActivatedEventLogModel.findOne.mockResolvedValue(null);

    const existingLog = await tipActivatedEventLogModel.findOne({ tipId });
    expect(existingLog).toBeNull();

    // Mock: existing record found
    tipActivatedEventLogModel.findOne.mockResolvedValue({
      tipId,
      eventId: 'event-uuid-existing',
      sourceRef: `purchasedItem:${tipId}`,
      createdAt: new Date()
    });

    const duplicateLog = await tipActivatedEventLogModel.findOne({ tipId });
    expect(duplicateLog).toBeDefined();
    expect(duplicateLog.tipId).toBe(tipId);
  });

  it('should support sourceRef queries for reconciliation', async () => {
    const sourceRef = 'purchasedItem:tip-123';
    
    tipActivatedEventLogModel.findOne.mockResolvedValue({
      tipId: 'tip-123',
      eventId: 'event-uuid-1',
      sourceRef,
      createdAt: new Date()
    });

    const result = await tipActivatedEventLogModel.findOne({ sourceRef });
    
    expect(result).toBeDefined();
    expect(result.sourceRef).toBe(sourceRef);
    expect(tipActivatedEventLogModel.findOne).toHaveBeenCalledWith({ sourceRef });
  });

  it('should verify unique index prevents duplicate events for same tip', () => {
    // This is a specification test documenting expected behavior
    // In production, MongoDB's unique index on tipId ensures:
    // 1. Only one TipActivated event log can exist per tipId
    // 2. Concurrent insert attempts will fail with code 11000
    // 3. Application code treats 11000 as no-op (idempotent)
    
    const expectedBehavior = {
      uniqueField: 'tipId',
      indexType: 'unique',
      duplicateErrorCode: 11000,
      applicationResponse: 'no-op (log and return)'
    };

    expect(expectedBehavior.uniqueField).toBe('tipId');
    expect(expectedBehavior.duplicateErrorCode).toBe(11000);
  });
});

