import { Injectable } from '@nestjs/common';
import { UserService } from 'src/modules/user/services';
import { UserDto } from 'src/modules/user/dtos';
import { FilterQuery, Model } from 'mongoose';
import * as moment from 'moment';
import { InjectModel } from '@nestjs/mongoose';
import { PageableData } from 'src/kernel';
import { PerformerDto } from 'src/modules/performer/dtos';
import { PaymentSearchPayload } from '../payloads';
import { PaymentTransactionDto } from '../dtos';
import { PAYMENT_STATUS } from '../constants';
import { PaymentTransaction } from '../schemas';

@Injectable()
export class PaymentSearchService {
  constructor(
    @InjectModel(PaymentTransaction.name) private readonly PaymentTransactionModel: Model<PaymentTransaction>,
    private readonly userService: UserService
  ) { }

  public async getUserTransactions(req: PaymentSearchPayload, user: UserDto): Promise<PageableData<PaymentTransactionDto>> {
    const query: FilterQuery<PaymentTransaction> = {
      buyerId: user._id,
      status: {
        $ne: PAYMENT_STATUS.PENDING
      }
    } as any;
    if (req.type) query.type = req.type;
    if (req.status) query.status = req.status;
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
      this.PaymentTransactionModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.PaymentTransactionModel.countDocuments(query)
    ]);

    const paymentData = data.map((d) => new PaymentTransactionDto(d));
    return {
      total,
      data: paymentData
    };
  }

  public async adminGetUserTransactions(req: PaymentSearchPayload): Promise<PageableData<PaymentTransactionDto>> {
    const query = {
      status: {
        $ne: PAYMENT_STATUS.PENDING
      }
    } as any;
    if (req.type) query.type = req.type;
    if (req.status) query.status = req.status;
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: moment(req.fromDate).startOf('day'),
        $lt: moment(req.toDate).endOf('day')
      };
    }
    if (req.sourceId) query.buyerId = req.sourceId;
    const sort: any = {
      [req.sortBy || 'updatedAt']: req.sort || -1
    };
    const [data, total] = await Promise.all([
      this.PaymentTransactionModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.PaymentTransactionModel.countDocuments(query)
    ]);

    const paymentData = data.map((d) => new PaymentTransactionDto(d));
    const userIds = paymentData
      .filter((p) => p.buyerSource === 'user')
      .map((p) => p.buyerId);

    if (userIds.length) {
      const users = await this.userService.findByIds(userIds);
      paymentData.forEach((p) => {
        const buyer = users.find((u) => u._id.toString() === p.buyerId.toString());
        p.setBuyerInfo(buyer);
      });
    }

    return {
      total,
      data: paymentData
    };
  }

  public async getPerformerTransactions(req: PaymentSearchPayload, performer: PerformerDto): Promise<any> {
    const query = {
      buyerSource: 'performer',
      buyerId: performer._id,
      status: {
        $ne: PAYMENT_STATUS.PENDING
      }
    } as any;

    if (req.type) query.type = req.type;
    if (req.status) query.status = req.status;
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: moment(req.fromDate).startOf('day'),
        $lt: moment(req.toDate).endOf('day')
      };
    }

    const sort = {
      [req.sortBy || 'updatedAt']: req.sort || -1
    };

    const [data, total] = await Promise.all([
      this.PaymentTransactionModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.PaymentTransactionModel.countDocuments(query)
    ]);

    const paymentData = data.map((d) => new PaymentTransactionDto(d));
    return {
      total,
      data: paymentData
    };
  }
}
