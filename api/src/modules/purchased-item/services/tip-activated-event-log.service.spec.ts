import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TipActivatedEventLogService } from './tip-activated-event-log.service';
import { TipActivatedEventLog } from '../schemas';
import { TipActivatedDto, TipActivatedLedgerDto } from '../dtos';

describe('TipActivatedEventLogService', () => {
  let service: TipActivatedEventLogService;
  let mockModel: any;

  const mockEventLog = {
    tipId: 'tip_12345',
    eventId: 'event_uuid_12345',
    ledgerId: 'ledger_entry_abc',
    sourceRef: 'TIP_12345',
    postedAt: new Date('2025-12-23T18:00:00Z'),
    payloadHash: 'hash123',
    createdAt: new Date('2025-12-23T18:00:00Z')
  };

  const MockModel: any = jest.fn().mockImplementation((dto) => ({
    ...dto,
    save: jest.fn().mockResolvedValue(dto)
  }));

  MockModel.findOne = jest.fn().mockReturnValue({
    lean: jest.fn()
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TipActivatedEventLogService,
        {
          provide: getModelToken(TipActivatedEventLog.name),
          useValue: MockModel
        }
      ]
    }).compile();

    service = module.get<TipActivatedEventLogService>(TipActivatedEventLogService);
    mockModel = module.get(getModelToken(TipActivatedEventLog.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hasEventBeenEmitted', () => {
    it('should return true if event exists for tipId', async () => {
      mockModel.findOne.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(mockEventLog)
      });

      const result = await service.hasEventBeenEmitted('tip_12345');

      expect(result).toBe(true);
      expect(mockModel.findOne).toHaveBeenCalledWith({ tipId: 'tip_12345' });
    });

    it('should return false if event does not exist for tipId', async () => {
      mockModel.findOne.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(null)
      });

      const result = await service.hasEventBeenEmitted('tip_99999');

      expect(result).toBe(false);
      expect(mockModel.findOne).toHaveBeenCalledWith({ tipId: 'tip_99999' });
    });
  });

  describe('persistEvent - Idempotency', () => {
    const ledger: TipActivatedLedgerDto = {
      ledgerId: 'ledger_entry_abc',
      sourceRef: 'TIP_12345',
      debitRef: 'debit_entry_123',
      creditRef: 'credit_entry_456',
      status: 'SETTLED',
      postedAt: '2025-12-23T18:00:00Z'
    };

    const payload: TipActivatedDto = {
      tipId: 'tip_12345',
      userId: 'user_123',
      performerId: 'performer_456',
      conversationId: 'conv_789',
      amount: 100,
      ledger,
      createdAt: '2025-12-23T18:00:00Z'
    };

    it('should persist event successfully when it does not exist', async () => {
      // Mock hasEventBeenEmitted to return false (no existing event)
      jest.spyOn(service, 'hasEventBeenEmitted').mockResolvedValue(false);

      // Create a mock instance with save method
      const saveMock = jest.fn().mockResolvedValue(mockEventLog);
      mockModel.mockImplementationOnce(() => ({
        save: saveMock
      }));

      const result = await service.persistEvent('event_uuid_12345', payload);

      expect(result).toBe(true);
      expect(service.hasEventBeenEmitted).toHaveBeenCalledWith('tip_12345');
    });

    it('should NOT persist event when it already exists (idempotent - duplicate tipId)', async () => {
      // Mock hasEventBeenEmitted to return true (event already exists)
      jest.spyOn(service, 'hasEventBeenEmitted').mockResolvedValue(true);

      const result = await service.persistEvent('event_uuid_12345', payload);

      expect(result).toBe(false);
      expect(service.hasEventBeenEmitted).toHaveBeenCalledWith('tip_12345');
    });

    it('should handle duplicate key error gracefully (race condition)', async () => {
      // Mock hasEventBeenEmitted to return false initially
      jest.spyOn(service, 'hasEventBeenEmitted').mockResolvedValue(false);

      // Mock model constructor and save to throw duplicate key error
      const duplicateKeyError: any = new Error('E11000 duplicate key error');
      duplicateKeyError.code = 11000;
      
      const saveMock = jest.fn().mockRejectedValue(duplicateKeyError);
      mockModel.mockImplementationOnce(() => ({
        save: saveMock
      }));

      const result = await service.persistEvent('event_uuid_12345', payload);

      expect(result).toBe(false);
      expect(service.hasEventBeenEmitted).toHaveBeenCalledWith('tip_12345');
    });
  });

  describe('getEventByTipId', () => {
    it('should retrieve event by tipId', async () => {
      mockModel.findOne.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(mockEventLog)
      });

      const result = await service.getEventByTipId('tip_12345');

      expect(result).toEqual(mockEventLog);
      expect(mockModel.findOne).toHaveBeenCalledWith({ tipId: 'tip_12345' });
    });

    it('should return null if event not found', async () => {
      mockModel.findOne.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(null)
      });

      const result = await service.getEventByTipId('tip_99999');

      expect(result).toBeNull();
    });
  });

  describe('getEventByLedgerId', () => {
    it('should retrieve event by ledgerId', async () => {
      mockModel.findOne.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(mockEventLog)
      });

      const result = await service.getEventByLedgerId('ledger_entry_abc');

      expect(result).toEqual(mockEventLog);
      expect(mockModel.findOne).toHaveBeenCalledWith({ ledgerId: 'ledger_entry_abc' });
    });

    it('should return null if event not found', async () => {
      mockModel.findOne.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(null)
      });

      const result = await service.getEventByLedgerId('ledger_99999');

      expect(result).toBeNull();
    });
  });
});
