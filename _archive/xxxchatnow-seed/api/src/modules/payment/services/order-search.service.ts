import {
  Injectable,
  Inject,
  forwardRef
} from '@nestjs/common';
import { Model } from 'mongoose';
import * as moment from 'moment';
import { PerformerService } from 'src/modules/performer/services';
import { UserService } from 'src/modules/user/services';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { OrderDto } from '../dtos';
import { OrderSearchPayload } from '../payloads';
import { Order } from '../schemas';

@Injectable()
export class OrderSearchService {
  constructor(
    @InjectModel(Order.name) private readonly OrderModel: Model<Order>,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService
  ) { }

  public async search(req: OrderSearchPayload) {
    const query = {} as any;
    if (req.deliveryStatus) query.deliveryStatus = req.deliveryStatus;
    if (req.sellerId) query.sellerId = req.sellerId;
    if (req.buyerId) query.buyerId = req.buyerId;
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: moment(req.fromDate).startOf('day'),
        $lt: moment(req.toDate).endOf('day')
      };
    }
    const sort: any = {
      [req.sortBy || 'updatedAt']: req.sort || -1
    };
    const [data, total] = await Promise.all([
      this.OrderModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.OrderModel.countDocuments(query)
    ]);

    const dtos = data.map((d) => plainToInstance(OrderDto, d));
    await this._mapSellerInfo(dtos);
    await this._mapBuyerInfo(dtos);
    return {
      total,
      data: dtos
    };
  }

  private async _mapSellerInfo(orders: OrderDto[]) {
    const performerIds = orders.filter((o) => o.sellerSource === 'performer')
      .map((o) => o.sellerId);
    if (!performerIds.length) return;
    const performers = await this.performerService.findByIds(performerIds);
    orders.forEach((o) => {
      if (o.sellerId) {
        const performer = performers.find((p) => p._id.toString() === o.sellerId.toString());
        o.setSellerInfo(performer);
      }
    });
  }

  private async _mapBuyerInfo(orders: OrderDto[]) {
    const userIds = orders.filter((o) => o.buyerSource === 'user')
      .map((o) => o.buyerId);
    if (!userIds.length) return;
    const users = await this.userService.findByIds(userIds);
    orders.forEach((o) => {
      if (o.buyerId) {
        const buyer = users.find((p) => p._id.toString() === o.buyerId.toString());
        o.setBuyerInfo(buyer);
      }
    });
  }
}
