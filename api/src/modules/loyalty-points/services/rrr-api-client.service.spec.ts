import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from 'nestjs-config';
import { of } from 'rxjs';
import { RRRApiClientService } from './rrr-api-client.service';
import { RRRLinkType } from '../constants';

describe('RRRApiClientService', () => {
  let service: RRRApiClientService;
  let httpService: HttpService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RRRApiClientService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
            get: jest.fn()
          }
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'rrr.apiBaseUrl': 'https://api.redroomrewards.com',
                'rrr.clientId': 'test-client-id',
                'rrr.clientSecret': 'test-client-secret'
              };
              return config[key];
            })
          }
        }
      ]
    }).compile();

    service = module.get<RRRApiClientService>(RRRApiClientService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLinkIntent', () => {
    it('should create a link intent successfully', async () => {
      const mockResponse = {
        data: {
          intent_id: 'test-intent-id',
          expires_at: '2025-12-23T18:00:00-05:00',
          rrr_link_code: 'ABC123'
        }
      };

      // Mock OAuth token response
      jest.spyOn(httpService, 'post').mockImplementation((url: string) => {
        if (url.includes('/oauth/token')) {
          return of({
            data: {
              access_token: 'mock-access-token',
              expires_in: 3600
            }
          } as any);
        }
        return of(mockResponse as any);
      });

      const result = await service.createLinkIntent({
        client_user_id: 'XCN_USER_12345',
        link_type: RRRLinkType.MEMBER
      });

      expect(result).toEqual(mockResponse.data);
      expect(httpService.post).toHaveBeenCalled();
    });
  });

  describe('getWallet', () => {
    it('should fetch wallet data successfully', async () => {
      const mockWalletData = {
        data: {
          member_id: 'test-member-id',
          available_points: 1250,
          escrow_points: 0,
          pending_points: 300,
          expiring_soon: [
            { points: 200, expires_at: '2026-01-15T00:00:00-05:00' }
          ],
          as_of: '2025-12-23T14:00:00-05:00'
        }
      };

      // Mock OAuth token response
      jest.spyOn(httpService, 'post').mockReturnValue(
        of({
          data: {
            access_token: 'mock-access-token',
            expires_in: 3600
          }
        } as any)
      );

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockWalletData as any));

      const result = await service.getWallet('test-member-id');

      expect(result).toEqual(mockWalletData.data);
      expect(httpService.get).toHaveBeenCalled();
    });
  });
});
