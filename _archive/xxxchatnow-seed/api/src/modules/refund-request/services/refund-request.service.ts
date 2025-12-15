import { Injectable, NotFoundException } from '@nestjs/common';
import { FilterQuery, Model, SortOrder } from 'mongoose';
import { ObjectId } from 'mongodb';
import { UserDto } from 'src/modules/user/dtos';
import { UserService } from 'src/modules/user/services';
import { PerformerService } from 'src/modules/performer/services';
import { MailerService } from 'src/modules/mailer';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { PageableData, QueueEvent, QueueEventService } from 'src/kernel';
import { merge } from 'lodash';
import * as moment from 'moment';
import { OrderService } from 'src/modules/payment/services';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { REFUND_REQUEST_ACTION, REFUND_REQUEST_CHANNEL } from '../constants';
import { DuplicateRequestException } from '../exceptions/duplicate.exception';
import { ProductService } from '../../performer-assets/services/product.service';
import { RefundRequestDto } from '../dtos/refund-request.dto';
import {
  RefundRequestCreatePayload,
  RefundRequestSearchPayload,
  RefundRequestUpdatePayload
} from '../payloads/refund-request.payload';
import { RefundRequest } from '../schemas/refund-request.schema';

@Injectable()
export class RefundRequestService {
  constructor(
    @InjectModel(RefundRequest.name) private readonly RefundRequestModel: Model<RefundRequest>,
    private readonly userService: UserService,
    private readonly performerService: PerformerService,
    private readonly productService: ProductService,
    private readonly mailService: MailerService,
    private readonly settingService: SettingService,
    private readonly orderService: OrderService,
    private readonly queueEventService: QueueEventService
  ) { }

  public async search(req: RefundRequestSearchPayload, user?: UserDto): Promise<PageableData<RefundRequestDto>> {
    const query: FilterQuery<RefundRequest> = {};

    if (user.roles.includes('admin') && req.userId) {
      query.userId = req.userId;
    } else if (!user.roles.includes('admin')) {
      query.userId = user._id;
    }
    if (req.performerId) query.performerId = req.performerId;
    if (req.sourceId) query.sourceId = req.sourceId;
    if (req.sourceType) query.sourceType = req.sourceType;
    if (req.status) query.status = req.status;

    let sort: Record<string, SortOrder> = {
      createdAt: -1
    };

    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }

    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: moment(req.fromDate).startOf('day'),
        $lte: moment(req.toDate).endOf('day')
      };
    }

    const [data, total] = await Promise.all([
      this.RefundRequestModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.RefundRequestModel.countDocuments(query)
    ]);
    // const requests = data.map((d) => new RefundRequestDto(d));
    const pIds = data.map((d) => d.performerId);
    const uIds = data.map((d) => d.userId);
    const orderIds = data.map((d) => d.sourceId);
    const [performers, users, orders, products] = await Promise.all([
      this.performerService.findByIds(pIds) || [],
      this.userService.findByIds(uIds) || [],
      this.orderService.findByIds(orderIds) || [],
      this.productService.findByPerformerIds(pIds) || []
    ]);

    const requests = data.map((request) => {
      const dto = plainToInstance(RefundRequestDto, request);
      const performer = request.performerId
        && performers.find(
          (p) => p._id.toString() === request.performerId.toString()
        );
      const userDto = request.userId
        && users.find((p) => p._id.toString() === request.userId.toString());
      const order = request.sourceId
        && orders.find((o) => o._id.toString() === request.sourceId.toString());
      const product = order
        && products.find((p) => p._id.toString() === order.productId.toString());

      dto.setUserInfo(userDto);
      dto.setPerformerInfo(performer);
      dto.setProductInfo(product);
      dto.setOrderInfo(order);
      return dto;
    });
    return {
      total,
      data: requests
    };
  }

  public async create(payload: RefundRequestCreatePayload, user?: UserDto): Promise<RefundRequestDto> {
    const data = {
      ...payload,
      userId: user._id,
      updatedAt: new Date(),
      createdAt: new Date()
    };
    const request = await this.RefundRequestModel.findOne({
      userId: user._id,
      sourceId: data.sourceId,
      performerId: data.performerId,
      token: data.token
    });
    if (request) throw new DuplicateRequestException();
    const resp = await this.RefundRequestModel.create(data);
    // TODO mailer
    const adminEmail = (await this.settingService.getKeyValue(SETTING_KEYS.ADMIN_EMAIL))
      || process.env.ADMIN_EMAIL;
    adminEmail
      && (await this.mailService.send({
        subject: 'New refund request',
        to: adminEmail,
        data: {
          request: resp
        },
        template: 'refund-request'
      }));
    return new RefundRequestDto(resp);
  }

  public async updateStatus(id: string | ObjectId, payload: RefundRequestUpdatePayload): Promise<RefundRequestDto> {
    const request = await this.RefundRequestModel.findById(id);
    if (!request) {
      throw new NotFoundException();
    }

    const oldStatus = request.status;
    merge(request, payload);
    request.updatedAt = new Date();
    await request.save();

    const dto = RefundRequestDto.fromModel(request);
    const event: QueueEvent = {
      channel: REFUND_REQUEST_CHANNEL,
      eventName: REFUND_REQUEST_ACTION.UPDATED,
      data: {
        oldStatus,
        request: dto
      }
    };
    await this.queueEventService.publish(event);
    return dto;
  }
}
