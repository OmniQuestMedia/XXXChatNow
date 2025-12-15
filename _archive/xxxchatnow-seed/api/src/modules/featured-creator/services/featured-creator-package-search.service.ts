import { Injectable } from '@nestjs/common';
import { Model, SortOrder } from 'mongoose';
import { PageableData } from 'src/kernel';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { FeaturedCreatorPackageSearchPayload } from '../payloads';
import { FeaturedCreatorPackage } from '../schemas';
import { FeaturedCreatorPackageDto } from '../dtos';

@Injectable()
export class FeaturedCreatorPackageSearchService {
  constructor(

    @InjectModel(FeaturedCreatorPackage.name) private readonly featuredCreatorPackageModel: Model<FeaturedCreatorPackage>
  ) {}

  public async search(req: any): Promise<PageableData<FeaturedCreatorPackageDto>> {
    const query = {} as any;
    if (req.q) {
      query.$or = [
        {
          name: { $regex: req.q }
        }
      ];
    }
    if (req.isActive) query.isActive = req.isActive;

    let sort: Record<string, SortOrder> = {
      updatedAt: -1
    };

    sort = {
      [req.sortBy || 'updatedAt']: req.sort || 'desc'
    };

    const [data, total] = await Promise.all([
      this.featuredCreatorPackageModel
        .find(query)
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.featuredCreatorPackageModel.countDocuments(query)
    ]);

    return {
      data: data.map((item) => plainToInstance(FeaturedCreatorPackageDto, item.toObject())),
      total
    };
  }

  public async performerSearch(req: FeaturedCreatorPackageSearchPayload): Promise<PageableData<FeaturedCreatorPackageDto>> {
    const query = {} as any;

    const sort = {
      [req.sortBy || 'updatedAt']: req.sort || -1
    };

    const [data, total] = await Promise.all([
      this.featuredCreatorPackageModel
        .find(query)
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.featuredCreatorPackageModel.countDocuments(query)
    ]);

    return {
      data: data.map((item) => plainToInstance(FeaturedCreatorPackageDto, item.toObject())),
      total
    };
  }
}
