import { Injectable, ForbiddenException, HttpException } from '@nestjs/common';
import { Model, FilterQuery } from 'mongoose';
import { MailerService } from 'src/modules/mailer';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { EarningService } from 'src/modules/earning/services/earning.service';
import {
  EntityNotFoundException, PageableData, QueueEvent, QueueEventService
} from 'src/kernel';
import { merge } from 'lodash';
import { StudioDto } from 'src/modules/studio/dtos';
import { StudioService } from 'src/modules/studio/services';
import { PerformerDto } from 'src/modules/performer/dtos';
import { PerformerService } from 'src/modules/performer/services';
import * as moment from 'moment';
import { PaymentInformationService } from 'src/modules/payment-information/services';
import { EarningSearchRequestPayload } from 'src/modules/earning/payloads';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import {
  PAYOUT_REQUEST_CHANEL, PAYOUT_REQUEST_EVENT
} from '../constants';
import {
  DuplicateRequestException,
  MinPayoutRequestRequiredException
} from '../exceptions';
import { PayoutRequestDto } from '../dtos/payout-request.dto';
import {
  PayoutRequestCreatePayload,
  PayoutRequestSearchPayload
} from '../payloads/payout-request.payload';
import { PayoutRequest } from '../schemas/payout-request.schema';

@Injectable()
export class StudioPayoutRequestService {
  constructor(
    @InjectModel(PayoutRequest.name) private readonly PayoutRequestModel: Model<PayoutRequest>,
    private readonly studioService: StudioService,
    private readonly mailService: MailerService,
    private readonly settingService: SettingService,
    private readonly earningService: EarningService,
    private readonly performerService: PerformerService,
    private readonly paymentInformationService: PaymentInformationService,
    private readonly queueEventService: QueueEventService
  ) { }

  public async findById(id): Promise<any> {
    const request = await this.PayoutRequestModel.findById(id);
    if (!request) {
      throw new EntityNotFoundException();
    }
    const data = new PayoutRequestDto(request);
    if (data.sourceId) {
      const studio = await this.studioService.findById(request.sourceId);
      data.studioInfo = studio ? new StudioDto(studio).toResponse() : null;
    }
    return data;
  }

  public async create(
    payload: PayoutRequestCreatePayload,
    user: StudioDto
  ): Promise<PayoutRequestDto> {
    const data = {
      ...payload,
      sourceId: user._id
    };
    const query: FilterQuery<PayoutRequest> = {
      // sourceType: SOURCE_TYPE.STUDIO,
      sourceId: user._id,
      status: 'pending'
      // fromDate: data.fromDate,
      // toDate: data.toDate
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

    payoutRequest = await this.PayoutRequestModel.create({
      ...data,
      tokenMustPay: statEarning.totalPrice,
      previousPaidOut: statEarning.paidPrice,
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

  public async update(
    id: string,
    payload: PayoutRequestCreatePayload,
    studio: StudioDto
  ): Promise<PayoutRequestDto> {
    const payout = await this.PayoutRequestModel.findOne({ _id: id });
    if (!payout) {
      throw new EntityNotFoundException();
    }

    if (studio._id.toString() !== payout.sourceId.toString()) {
      throw new ForbiddenException();
    }
    if (!['pending'].includes(payout.status)) {
      throw new HttpException('This request has been processed, please create new request!', 400);
    }

    // recheck for payment information
    const { paymentAccountType } = payload;
    const paymentAccountInfo = await this.paymentInformationService.detail({ type: paymentAccountType }, studio._id);
    if (!paymentAccountInfo) {
      throw new HttpException('Please enter your Bank details under account settings menu', 400);
    }

    // TODO update for performer request
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

    const oldStatus = payout.status;
    merge(payout, payload);
    payout.tokenMustPay = statEarning.totalPrice;
    payout.previousPaidOut = statEarning.paidPrice;
    payout.pendingToken = statEarning.remainingPrice;
    payout.updatedAt = new Date();
    payout.paymentAccountInfo = paymentAccountInfo;
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

    const event: QueueEvent = {
      channel: PAYOUT_REQUEST_CHANEL,
      eventName: PAYOUT_REQUEST_EVENT.UPDATED,
      data: {
        request: payout,
        oldStatus
      }
    };
    await this.queueEventService.publish(event);
    return new PayoutRequestDto(payout);
  }

  public async details(id: string, user: StudioDto) {
    const payout = await this.PayoutRequestModel.findById(id);
    if (!payout) {
      throw new EntityNotFoundException();
    }

    if (user._id.toString() !== payout.sourceId.toString()) {
      throw new ForbiddenException();
    }

    const data = new PayoutRequestDto(payout);
    if (data.sourceId) {
      const studio = await this.studioService.findById(payout.sourceId);
      data.studioInfo = studio ? new StudioDto(studio).toResponse() : null;
    }
    return data;
  }

  public getRequestSource(request: PayoutRequestDto | PayoutRequest): Promise<PerformerDto | StudioDto> {
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

  public async adminDetails(id: string): Promise<PayoutRequestDto> {
    const request = await this.PayoutRequestModel.findById(id);
    if (!request) {
      throw new EntityNotFoundException();
    }
    const dto = plainToInstance(PayoutRequestDto, request.toObject());
    const sourceInfo = await this.getRequestSource(request);
    dto.setSourceInfo(sourceInfo);
    if (!request.paymentAccountInfo) {
      const { paymentAccountType } = request;
      const paymentAccountInfo = await this.paymentInformationService.detail(
        { type: paymentAccountType },
        request.sourceId
      );
      dto.paymentAccountInfo = paymentAccountInfo;
    }

    return dto;
  }

  async performerRequest(req: PayoutRequestSearchPayload, studio: StudioDto): Promise<PageableData<PayoutRequestDto>> {
    const query = {} as any;
    if (req.status) {
      query.status = req.status;
    }

    query.studioRequestId = studio._id;
    let sort: any = {
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
      this.PayoutRequestModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.PayoutRequestModel.countDocuments(query)
    ]);
    const requests = data.map((d) => plainToInstance(PayoutRequestDto, d));
    const performerIds = data.map((d) => d.performerId);
    const [performers] = await Promise.all([
      performerIds.length ? this.performerService.findByIds(performerIds) : []
    ]);

    requests.forEach((request: PayoutRequestDto) => {
      const performer = performers.find(
        (p) => p._id.toString() === request.performerId.toString()
      );
      request.setPerformerInfo(performer);
    });
    return {
      total,
      data: requests
    };
  }

  public async calculateStats(
    sourceId: string
  ): Promise<any> {
    const stats = await this.earningService.calculatePayoutRequestStats({ targetId: sourceId } as EarningSearchRequestPayload);
    const lastPaid = await this.PayoutRequestModel.find({
      status: 'done',
      sourceId
    })
      .limit(1)
      .sort({
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
}
