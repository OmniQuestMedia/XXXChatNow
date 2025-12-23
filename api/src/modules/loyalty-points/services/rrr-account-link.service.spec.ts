import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RRRAccountLinkService } from './rrr-account-link.service';
import { RRRApiClientService } from './rrr-api-client.service';
import { RRRAccountLink } from '../schemas';
import { RRRLinkType, RRRLinkStatus } from '../constants';

describe('RRRAccountLinkService', () => {
  let service: RRRAccountLinkService;
  let accountLinkModel: Model<any>;
  let rrrApiClient: RRRApiClientService;

  const mockUserId = new ObjectId();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RRRAccountLinkService,
        {
          provide: getModelToken(RRRAccountLink.name),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            countDocuments: jest.fn()
          }
        },
        {
          provide: RRRApiClientService,
          useValue: {
            createLinkIntent: jest.fn(),
            confirmLink: jest.fn(),
            getLinkStatus: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<RRRAccountLinkService>(RRRAccountLinkService);
    accountLinkModel = module.get<Model<any>>(getModelToken(RRRAccountLink.name));
    rrrApiClient = module.get<RRRApiClientService>(RRRApiClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLinkIntent', () => {
    it('should create a link intent successfully', async () => {
      const mockResponse = {
        intent_id: 'test-intent-id',
        expires_at: '2025-12-23T18:00:00-05:00',
        rrr_link_code: 'ABC123'
      };

      jest.spyOn(accountLinkModel, 'findOne').mockResolvedValue(null);
      jest.spyOn(rrrApiClient, 'createLinkIntent').mockResolvedValue(mockResponse);
      jest.spyOn(accountLinkModel, 'create').mockResolvedValue({} as any);

      const result = await service.createLinkIntent(mockUserId, RRRLinkType.MEMBER);

      expect(result).toEqual(mockResponse);
      expect(accountLinkModel.findOne).toHaveBeenCalledWith({
        userId: mockUserId,
        status: RRRLinkStatus.ACTIVE
      });
      expect(rrrApiClient.createLinkIntent).toHaveBeenCalled();
    });

    it('should throw error if user already has active link', async () => {
      jest.spyOn(accountLinkModel, 'findOne').mockResolvedValue({
        userId: mockUserId,
        status: RRRLinkStatus.ACTIVE
      });

      await expect(
        service.createLinkIntent(mockUserId, RRRLinkType.MEMBER)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getLinkStatus', () => {
    it('should return linked status when user has active link', async () => {
      const mockLink = {
        userId: mockUserId,
        rrrMemberId: 'test-rrr-member-id',
        linkType: RRRLinkType.MEMBER,
        status: RRRLinkStatus.ACTIVE,
        linkedAt: new Date('2025-12-23T00:00:00Z')
      };

      jest.spyOn(accountLinkModel, 'findOne').mockResolvedValue(mockLink);

      const result = await service.getLinkStatus(mockUserId);

      expect(result).toEqual({
        linked: true,
        rrr_member_id: 'test-rrr-member-id',
        link_type: RRRLinkType.MEMBER,
        linked_at: mockLink.linkedAt.toISOString()
      });
    });

    it('should return not linked status when user has no active link', async () => {
      jest.spyOn(accountLinkModel, 'findOne').mockResolvedValue(null);

      const result = await service.getLinkStatus(mockUserId);

      expect(result).toEqual({
        linked: false
      });
    });
  });

  describe('getRRRMemberId', () => {
    it('should return RRR member ID for linked user', async () => {
      const mockLink = {
        rrrMemberId: 'test-rrr-member-id'
      };

      jest.spyOn(accountLinkModel, 'findOne').mockResolvedValue(mockLink);

      const result = await service.getRRRMemberId(mockUserId);

      expect(result).toBe('test-rrr-member-id');
    });

    it('should return null for unlinked user', async () => {
      jest.spyOn(accountLinkModel, 'findOne').mockResolvedValue(null);

      const result = await service.getRRRMemberId(mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('isUserLinked', () => {
    it('should return true when user is linked', async () => {
      jest.spyOn(accountLinkModel, 'countDocuments').mockResolvedValue(1);

      const result = await service.isUserLinked(mockUserId);

      expect(result).toBe(true);
    });

    it('should return false when user is not linked', async () => {
      jest.spyOn(accountLinkModel, 'countDocuments').mockResolvedValue(0);

      const result = await service.isUserLinked(mockUserId);

      expect(result).toBe(false);
    });
  });
});
