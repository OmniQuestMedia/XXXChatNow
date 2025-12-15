import { Injectable, ForbiddenException, HttpException } from '@nestjs/common';
import { FilterQuery, Model, SortOrder } from 'mongoose';
import { ObjectId } from 'mongodb';
import { UserDto } from 'src/modules/user/dtos';
import { PerformerDto } from 'src/modules/performer/dtos';
import { PerformerService } from 'src/modules/performer/services';
import { MailerService } from 'src/modules/mailer';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { EarningService } from 'src/modules/earning/services/earning.service';
import {
  EntityNotFoundException,
  QueueEventService,
  QueueEvent,
  PageableData
} from 'src/kernel';
import { merge } from 'lodash';
import { StudioService } from 'src/modules/studio/services';
import { StudioDto } from 'src/modules/studio/dtos';
import { toObjectId } from 'src/kernel/helpers/string.helper';
import * as moment from 'moment';
import { PaymentInformationService } from 'src/modules/payment-information/services';
import { EarningSearchRequestPayload } from 'src/modules/earning/payloads';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import {
  PAYOUT_REQUEST_CHANEL,
  PAYOUT_REQUEST_EVENT
} from '../constants';
import {
  DuplicateRequestException,
  MinPayoutRequestRequiredException
} from '../exceptions';
import { PayoutRequestDto } from '../dtos/payout-request.dto';
import {
  PayoutRequestCreatePayload,
  PayoutRequestSearchPayload,
  PayoutRequestUpdatePayload
} from '../payloads/payout-request.payload';
import { PayoutRequest } from '../schemas/payout-request.schema';

@Injectable()
export class PayoutRequestService {
  constructor(
    @InjectModel(PayoutRequest.name) private readonly PayoutRequestModel: Model<PayoutRequest>,
    private readonly studioService: StudioService,
    private readonly queueEventService: QueueEventService,
    private readonly performerService: PerformerService,
    private readonly mailService: MailerService,
    private readonly settingService: SettingService,
    private readonly earningService: EarningService,
    private readonly paymentInformationService: PaymentInformationService
  ) { }

  public async search(
    req: PayoutRequestSearchPayload,
    user?: UserDto
  ): Promise<PageableData<PayoutRequestDto>> {
    const query: FilterQuery<PayoutRequest> = {};
    if (req.sourceId) query.sourceId = toObjectId(req.sourceId);
    if (req.performerId) query.performerId = toObjectId(req.performerId);
    if (req.sourceType) query.sourceType = req.sourceType;
    if (req.status) query.status = req.status;

    let sort: Record<string, SortOrder> = {
      createdAt: -1
    };

    sort = {
      [req.sortBy || 'createdAt']: req.sort || 'desc'
    };

    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: moment(req.fromDate).startOf('day').toDate(),
        $lte: moment(req.toDate).endOf('day').toDate()
      };
    }

    const [data, total] = await Promise.all([
      this.PayoutRequestModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.PayoutRequestModel.countDocuments(query)
    ]);
    const requests = data.map((d) => plainToInstance(PayoutRequestDto, d));
    if (user?.roles?.includes('admin')) {
      // TODO - optimize me
      const sources = await Promise.all(
        requests.map((request) => this.getRequestSource(request))
      );
      requests.forEach((request: PayoutRequestDto) => {
        const sourceInfo = sources.find(
          (source) => source && source._id.toString() === request.sourceId.toString()
        );
        request.setSourceInfo(sourceInfo);
      });
    }
    return {
      total,
      data: requests
    };
  }

  public async getPendingRequests(performerId: string): Promise<any> {
    const data = await this.PayoutRequestModel.findOne({ performerId, status: 'pending' });
    if (!data) {
      return null;
    }
    return plainToInstance(PayoutRequestDto, data.toObject());
  }

  getRequestSource(
    request: PayoutRequestDto | PayoutRequest
  ): Promise<PerformerDto | StudioDto> {
    const { sourceType, sourceId } = request;
    switch (sourceType) {
      case 'performer':
        return this.performerService.findById(sourceId);
      case 'studio':
        return this.studioService.findById(sourceId);
      default:
        return null;
    }
  }

  public async findById(id: string | object): Promise<PayoutRequestDto> {
    const request = await this.PayoutRequestModel.findById(id);
    if (!request) return null;
    return plainToInstance(PayoutRequestDto, request.toObject());
  }

  public async create(
    payload: PayoutRequestCreatePayload,
    user?: PerformerDto
  ): Promise<PayoutRequestDto> {
    const data = {
      ...payload,
      performerId: user._id,
      studioRequestId: user?.studioId,
      sourceId: user._id
    };
    const query = {
      sourceId: user._id,
      performerId: user._id,
      status: 'pending'
    };
    let payoutRequest = await this.PayoutRequestModel.findOne(query);
    if (payoutRequest) {
      throw new DuplicateRequestException();
    }

    // recheck for payment information
    const { paymentAccountType } = payload;
    const paymentAccountInfo = await this.paymentInformationService.detail({ type: paymentAccountType }, user._id);

    if (!paymentAccountInfo) {
      throw new HttpException('Please enter your Bank details under account settings menu', 400);
    }

    const [statEarning, minPayoutRequest] = await Promise.all([
      this.earningService.calculatePayoutRequestStats({
        targetId: query.sourceId,
        fromDate: data.fromDate,
        toDate: data.toDate
      }),
      this.settingService.getKeyValue(SETTING_KEYS.MINIMUM_PAYOUT_REQUEST) || 0
    ]);

    if (statEarning.totalPrice < minPayoutRequest) {
      throw new MinPayoutRequestRequiredException(`Min amount to send request is ${minPayoutRequest}. Please try again`);
    }

    // overwrite previous paid out
    const previousPaid = await this.PayoutRequestModel.find({
      sourceId: data.sourceId,
      status: 'done',
      createdAt: {
        $lt: new Date()
      }
    })
      .sort({
        createdAt: -1
      })
      .limit(1);

    payoutRequest = await this.PayoutRequestModel.create({
      ...data,
      tokenMustPay: statEarning.totalPrice,
      previousPaidOut: previousPaid.length ? previousPaid[0].tokenMustPay : 0,
      pendingToken: statEarning.remainingPrice,
      paymentAccountInfo
    });

    const adminEmail = await this.settingService.getKeyValue(SETTING_KEYS.ADMIN_EMAIL);
    if (adminEmail) {
      await this.mailService.send({
        subject: 'New payout request',
        to: adminEmail,
        data: {
          request: payoutRequest
        },
        template: 'payout-request'
      });
    }
    return new PayoutRequestDto(payoutRequest);
  }

  public async calculateStats(
    sourceId: string
  ): Promise<any> {
    const stats = await this.earningService.calculatePayoutRequestStats({ performerId: sourceId, targetId: sourceId } as EarningSearchRequestPayload);

    const lastPaid = await this.PayoutRequestModel.find({
      status: 'done',
      sourceId
    }).limit(1).sort({
      createdAt: -1
    });
    const lastpaid = lastPaid?.length ? lastPaid[0] : null;

    return {
      paidPrice: stats.paidPrice,
      unpaidPrice: stats.remainingPrice,
      totalPrice: stats.totalEarning,
      lastPaid: {
        token: lastpaid?.tokenMustPay,
        requestDate: lastpaid?.createdAt,
        paymentDate: lastpaid?.updatedAt
      }
    };
  }

  public async update(
    id: string,
    payload: PayoutRequestCreatePayload,
    performer: PerformerDto
  ): Promise<PayoutRequestDto> {
    const payout = await this.PayoutRequestModel.findOne({ _id: id });
    if (!payout) {
      throw new EntityNotFoundException();
    }

    if (performer._id.toString() !== payout.sourceId.toString()) {
      throw new ForbiddenException();
    }
    if (!['pending'].includes(payout.status)) {
      throw new HttpException('This request has been processed, please create new request!', 400);
    }

    // recheck for payment information
    const { paymentAccountType } = payload;
    const paymentAccountInfo = await this.paymentInformationService.detail({ type: paymentAccountType }, payout.sourceId);
    if (!paymentAccountInfo) {
      throw new HttpException('Please enter your Bank details under account settings menu', 400);
    }

    merge(payout, payload);
    const [statEarning, minPayoutRequest] = await Promise.all([
      this.earningService.calculatePayoutRequestStats({
        targetId: payout.sourceId,
        fromDate: payload.fromDate,
        toDate: payload.toDate
      }),
      this.settingService.getKeyValue(SETTING_KEYS.MINIMUM_PAYOUT_REQUEST) || 0
    ]);
    if (statEarning.totalPrice < minPayoutRequest) {
      throw new MinPayoutRequestRequiredException(`Min amount to send request is ${minPayoutRequest}. Please try again`);
    }

    const previousPaid = await this.PayoutRequestModel.find({
      _id: {
        $ne: payout._id
      },
      sourceId: payout.sourceId,
      status: 'done',
      createdAt: {
        $lt: new Date()
      }
    })
      .sort({
        createdAt: -1
      })
      .limit(1);

    payout.tokenMustPay = statEarning.totalPrice;
    payout.previousPaidOut = previousPaid.length ? previousPaid[0].tokenMustPay : 0;
    payout.pendingToken = statEarning.remainingPrice;
    payout.updatedAt = new Date();
    await payout.save();
    const adminEmail = await this.settingService.getKeyValue(SETTING_KEYS.ADMIN_EMAIL);
    if (adminEmail) {
      await this.mailService.send({
        subject: 'Update payout request',
        to: adminEmail,
        data: {
          request: payout
        },
        template: 'payout-request'
      });
    }
    return new PayoutRequestDto(payout);
  }

  public async details(id: string, user: PerformerDto) {
    const payout = await this.PayoutRequestModel.findById(id);
    if (!payout) {
      throw new EntityNotFoundException();
    }

    if (user._id.toString() !== payout.sourceId.toString()) {
      throw new ForbiddenException();
    }

    const data = new PayoutRequestDto(payout);
    if (data.sourceId) {
      const performerDto = await this.performerService.findById(
        payout.sourceId
      );
      data.setPerformerInfo(performerDto);
    }
    return data;
  }

  public async adminDetails(id: string): Promise<PayoutRequestDto> {
    const request = await this.PayoutRequestModel.findById(id);
    if (!request) {
      throw new EntityNotFoundException();
    }

    // overwrite previous paid out
    const previousPaid = await this.PayoutRequestModel.find({
      _id: { $ne: request._id },
      sourceId: request.sourceId,
      status: 'done',
      createdAt: {
        $lt: request.createdAt
      }
    })
      .sort({
        createdAt: -1
      })
      .limit(1);

    const dto = plainToInstance(PayoutRequestDto, request.toObject());
    const sourceInfo = await this.getRequestSource(request);
    dto.setSourceInfo(sourceInfo);
    dto.previousPaidOut = previousPaid.length ? previousPaid[0].tokenMustPay : 0;

    if (!request.paymentAccountInfo) {
      const { paymentAccountType } = request;
      const paymentAccountInfo = await this.paymentInformationService.detail(
        { type: paymentAccountType },
        request.sourceId
      );

      dto.paymentAccountInfo = paymentAccountInfo;
      return dto;
    }

    return dto;
  }

  public async updateStatus(
    id: string | ObjectId,
    payload: PayoutRequestUpdatePayload,
    user?: UserDto
  ): Promise<PayoutRequestDto> {
    const request = await this.PayoutRequestModel.findById(id);
    if (!request) throw new EntityNotFoundException();

    if (user && user.roles.includes('studio') && user._id.toString() !== request.studioRequestId.toString()) {
      throw new ForbiddenException();
    }

    const oldStatus = request.status;
    merge(request, payload);
    request.updatedAt = new Date();
    await request.save();

    const dto = plainToInstance(PayoutRequestDto, request.toObject());

    const event: QueueEvent = {
      channel: PAYOUT_REQUEST_CHANEL,
      eventName: PAYOUT_REQUEST_EVENT.UPDATED,
      data: {
        request: dto,
        oldStatus
      }
    };
    await this.queueEventService.publish(event);
    return dto;
  }
}
