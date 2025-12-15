import {
  QueueEventService,
  EntityNotFoundException, PageableData
} from 'src/kernel';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { BuyFeaturedCreatorPackagePayload } from 'src/modules/payment/payloads';
import { PerformerDto } from 'src/modules/performer/dtos';
import { NotEnoughMoneyException } from 'src/modules/purchased-item/exceptions';
import { PackageExistedException } from 'src/modules/user/exceptions';
import { EVENT } from 'src/kernel/constants';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { FeaturedCreatorBookingDto, FeaturedCreatorPackageDto } from '../dtos';
import {
  FeaturedCreatorBookingUpdatePayload,
  FeaturedCreatorPackageCreatePayload,
  FeaturedCreatorPackageSearchPayload,
  FeaturedCreatorPackageUpdatePayload
} from '../payloads';
import { FEATURED_CREATOR_BOOKING_CHANNEL } from '../constants';
import { FeaturedCreatorBooking, FeaturedCreatorPackage } from '../schemas';

@Injectable()
export class FeaturedCreatorPackageService {
  constructor(
    @InjectModel(FeaturedCreatorBooking.name) private readonly featuredCreatorBookingModel: Model<FeaturedCreatorBooking>,

    @InjectModel(FeaturedCreatorPackage.name) private readonly featuredCreatorPackageModel: Model<FeaturedCreatorPackage>,

    private readonly queueEventService: QueueEventService
  ) {}

  public async find(params: any): Promise<FeaturedCreatorPackageDto[]> {
    return this.featuredCreatorPackageModel.find(params);
  }

  public async findById(id: string | ObjectId): Promise<FeaturedCreatorPackageDto> {
    const featuredCreatorPackage = await this.featuredCreatorPackageModel.findOne({ _id: id });

    if (!featuredCreatorPackage) {
      throw new EntityNotFoundException();
    }

    return plainToInstance(FeaturedCreatorPackageDto, featuredCreatorPackage.toObject());
  }

  public findBydIds(ids: string[]) {
    return this.featuredCreatorPackageModel.find({ _id: { $in: ids } });
  }

  public async create(
    payload: FeaturedCreatorPackageCreatePayload
  ): Promise<FeaturedCreatorPackageDto> {
    const data = {
      ...payload
    };

    const tokenPackage = await this.featuredCreatorPackageModel.create(data);

    return plainToInstance(FeaturedCreatorPackageDto, tokenPackage.toObject());
  }

  public async update(
    id: string | ObjectId,
    payload: FeaturedCreatorPackageUpdatePayload
  ): Promise<any> {
    const featuredPackage = await this.featuredCreatorPackageModel.findById(id);
    if (!featuredPackage) {
      throw new EntityNotFoundException();
    }

    await this.featuredCreatorPackageModel.updateOne(
      { _id: featuredPackage._id },
      {
        $set: {
          ...payload,
          updatedAt: new Date()
        }
      }
    );

    return {
      success: true
    };
  }

  public async delete(id: string | ObjectId): Promise<boolean> {
    const tokenPackage = await this.featuredCreatorPackageModel.findById(id);
    if (!tokenPackage) {
      throw new EntityNotFoundException();
    }

    await tokenPackage.deleteOne();
    return true;
  }

  public async getPublic(id: string): Promise<FeaturedCreatorPackageDto> {
    const tokenPackage = await this.featuredCreatorPackageModel.findById(id);
    if (!tokenPackage) {
      throw new EntityNotFoundException();
    }

    const dto = new FeaturedCreatorPackageDto(tokenPackage);
    return dto;
  }

  public async performerBooking(packageId: string, performer: PerformerDto, payload: BuyFeaturedCreatorPackagePayload) {
    const featuredCreatorPackage = await this.featuredCreatorPackageModel.findOne({ _id: packageId });
    if (!featuredCreatorPackage) {
      throw new EntityNotFoundException();
    }

    if (performer.balance < featuredCreatorPackage.price) {
      throw new NotEnoughMoneyException();
    }

    const existPackage = await this.featuredCreatorBookingModel.findOne({
      packageId: featuredCreatorPackage._id,
      performerId: performer._id
    });

    if (existPackage) {
      throw new PackageExistedException();
    }

    await this.featuredCreatorBookingModel.create({
      name: featuredCreatorPackage.name,
      price: featuredCreatorPackage.price,
      description: featuredCreatorPackage.description,
      packageId: featuredCreatorPackage._id,
      performerId: performer._id,
      status: 'pending',
      startDate: payload.startDate,
      endDate: payload.endDate
    });

    return { success: true };
  }

  public async searchBooking(req: FeaturedCreatorPackageSearchPayload): Promise<PageableData<FeaturedCreatorBookingDto>> {
    const query = {} as any;

    const sort = {
      [req.sortBy || 'updatedAt']: req.sort || -1
    };

    const [data, total] = await Promise.all([
      this.featuredCreatorBookingModel
        .find(query)
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.featuredCreatorBookingModel.countDocuments(query)
    ]);

    return {
      data: data.map((item) => plainToInstance(FeaturedCreatorBookingDto, item.toObject())),
      total
    };
  }

  public async getBookingById(id: string | ObjectId): Promise<FeaturedCreatorBookingDto> {
    const packageBooking = await this.featuredCreatorBookingModel.findOne({ _id: id });

    if (!packageBooking) {
      throw new EntityNotFoundException();
    }
    return plainToInstance(FeaturedCreatorBookingDto, packageBooking.toObject());
  }

  public async updateBooking(
    id: string | ObjectId,
    payload: FeaturedCreatorBookingUpdatePayload
  ): Promise<any> {
    const featuredPackage = await this.featuredCreatorBookingModel.findById(id);

    if (!featuredPackage) {
      throw new EntityNotFoundException();
    }

    if (payload.status === 'approved') {
      this.queueEventService.publish({
        channel: FEATURED_CREATOR_BOOKING_CHANNEL,
        eventName: EVENT.UPDATED,
        data: {
          packageId: featuredPackage.packageId,
          performerId: featuredPackage.performerId,
          startDate: featuredPackage.startDate,
          endDate: featuredPackage.endDate,
          price: featuredPackage.price
        }
      });
    }

    await this.featuredCreatorBookingModel.updateOne(
      { _id: featuredPackage._id },
      {
        $set: {
          status: payload.status,
          updatedAt: new Date()
        }
      }
    );

    return {
      success: true
    };
  }
}
