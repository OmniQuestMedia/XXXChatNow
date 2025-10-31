import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { Request } from 'express';
import { CountryService } from 'src/modules/utils/services';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { whiteListIps } from '../constants';
import { BlockSetting } from '../schemas';
import { BlockSettingDto } from '../dtos';

@Injectable()
export class PerformerBlockSettingService {
  constructor(
    @InjectModel(BlockSetting.name) private readonly PerformerBlockSetting: Model<BlockSetting>,
    private readonly countryService: CountryService
  ) { }

  public async findByPerformerId(performerId: string | ObjectId): Promise<BlockSettingDto> {
    const item = await this.PerformerBlockSetting.findOne({ performerId });
    if (!item) return null;

    return plainToInstance(BlockSettingDto, item.toObject());
  }

  public async checkBlockByPerformerId(
    performerId: string | ObjectId,
    userId: string | ObjectId,
    req?: Request
  ): Promise<boolean> {
    const blockSetting = await this.findByPerformerId(performerId);
    if (blockSetting) {
      const { userIds, countries } = blockSetting;
      if (userIds.findIndex((id) => `${id}` === `${userId}`) > -1) {
        return true;
      }

      if (req && countries.length) {
        let ipClient = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        ipClient = Array.isArray(ipClient) ? ipClient.toString() : ipClient;
        if (ipClient.substr(0, 7) === '::ffff:') {
          ipClient = ipClient.substr(7);
        }
        if (whiteListIps.indexOf(ipClient) === -1) {
          const resp = await this.countryService.findCountryByIP(ipClient);
          if (
            resp
            && resp.status === 200
            && resp.data
            && resp.data.countryCode
          ) {
            if (countries.findIndex((code) => code === resp.data.countryCode) > -1) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }
}
