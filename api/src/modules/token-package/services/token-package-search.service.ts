import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { PageableData } from 'src/kernel';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { TokenPackageSearchPayload } from '../payloads';
import { TokenPackage } from '../schemas';
import { TokenPackageDto } from '../dtos';

@Injectable()
export class TokenPackageSearchService {
  constructor(
    @InjectModel(TokenPackage.name) private readonly TokenPackageModel: Model<TokenPackage>
  ) { }

  public async search(req: TokenPackageSearchPayload): Promise<PageableData<TokenPackageDto>> {
    const query = {} as any;
    if (req.q) {
      query.$or = [
        {
          name: { $regex: req.q }
        }
      ];
    }
    if (req.isActive) query.isActive = req.isActive;
    const sort: any = {
      [req.sortBy || 'updatedAt']: req.sort
    };
    const [data, total] = await Promise.all([
      this.TokenPackageModel
        .find(query)
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.TokenPackageModel.countDocuments(query)
    ]);

    return {
      data: data.map((item) => plainToInstance(TokenPackageDto, item.toObject())),
      total
    };
  }

  public async userSearch(req: TokenPackageSearchPayload): Promise<PageableData<TokenPackageDto>> {
    const query = {} as any;
    if (req.q) {
      query.$or = [
        {
          name: { $regex: req.q }
        }
      ];
    }
    query.isActive = true;
    const sort: any = {
      [req.sortBy || 'ordering']: (req.sort || 1)
    };
    const [data, total] = await Promise.all([
      this.TokenPackageModel
        .find(query)
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.TokenPackageModel.countDocuments(query)
    ]);

    return {
      data: data.map((item) => plainToInstance(TokenPackageDto, item.toObject())),
      total
    };
  }
}
