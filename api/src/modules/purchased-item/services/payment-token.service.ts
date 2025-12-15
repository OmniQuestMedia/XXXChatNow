import { Injectable } from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { InjectModel } from '@nestjs/mongoose';
import { UserDto } from 'src/modules/user/dtos';
import {
  PURCHASE_ITEM_STATUS
} from '../constants';
import { PurchasedItem } from '../schemas';
import { PurchasedItemDto } from '../dtos';

@Injectable()
export class PaymentTokenService {
  constructor(
    @InjectModel(PurchasedItem.name) private readonly PurchasedItemModel: Model<PurchasedItem>
  ) { }

  public async checkBoughtVideo(id: string | ObjectId, user: string | ObjectId | UserDto): Promise<boolean> {
    if (!user) return false;

    const sourceId = user._id || user;
    if (!sourceId) return false;
    const transaction = await this.PurchasedItemModel.findOne({
      targetId: id,
      sourceId,
      // type: PURCHASE_ITEM_TYPE.SALE_VIDEO,
      status: PURCHASE_ITEM_STATUS.SUCCESS
    });
    return !!transaction;
  }

  public async checkBought(id: string | ObjectId, user: string | ObjectId): Promise<boolean> {
    const sourceId = user._id || user;
    if (!sourceId) return false;

    const transaction = await this.PurchasedItemModel.findOne({
      // type, // do not need
      targetId: id,
      sourceId,
      status: PURCHASE_ITEM_STATUS.SUCCESS
    });
    return !!transaction;
  }

  public async findByQuery(query: FilterQuery<PurchasedItem>): Promise<PurchasedItemDto[]> {
    const data = await this.PurchasedItemModel.find(query);
    return data.map((item) => PurchasedItemDto.fromModel(item));
  }
}
