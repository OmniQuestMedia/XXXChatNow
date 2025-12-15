import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { EntityNotFoundException, PageableData } from 'src/kernel';
import { toObjectId } from 'src/kernel/helpers/string.helper';
import { uniq } from 'lodash';
import * as moment from 'moment';
import { UserDto } from 'src/modules/user/dtos';
import { UserService } from 'src/modules/user/services';
import { ReferralService } from 'src/modules/referral/services/referral.service';
import { InjectModel } from '@nestjs/mongoose';
import { PerformerService } from '../../performer/services';
import { ReferralEarningDto, IReferralEarningStatResponse } from '../dtos/referral-earning.dto';
import { ReferralEarningSearchRequestPayload } from '../payloads/referral-earning-search.payload';
import { ReferralEarning } from '../schemas/referral-earning.schema';

@Injectable()
export class ReferralEarningService {
  constructor(
    @InjectModel(ReferralEarning.name) private readonly ReferralEarningModel: Model<ReferralEarning>,
    @Inject(forwardRef(() => ReferralService))
    private readonly referralService: ReferralService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService
  ) {}

  public async search(
    req: ReferralEarningSearchRequestPayload
  ): Promise<PageableData<ReferralEarningDto>> {
    const query = {} as any;
    if (req.referralId) {
      query.referralId = req.referralId;
    }
    if (req.registerId) {
      query.registerId = req.registerId;
    }

    if (req.type) {
      query.type = req.type;
    }

    if (req.isPaid) {
      query.isPaid = req.isPaid === 'true';
    }

    if (req.isToken) {
      query.isToken = req.isToken === 'true';
    }

    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gte: moment(req.fromDate).startOf('day').toDate(),
        $lte: moment(req.toDate).startOf('day').toDate()
      };
    }

    let sort = {
      createdAt: -1
    } as any;

    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }

    const [data, total] = await Promise.all([
      this.ReferralEarningModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(+req.limit)
        .skip(+req.offset),
      this.ReferralEarningModel.countDocuments(query)
    ]);
    const earnings = data.map((d) => new ReferralEarningDto(d));
    const registerIds = data.map((d) => d.registerId);
    const referralIds = data.map((d) => d.referralId);
    const Ids = uniq(registerIds.concat(referralIds));
    const [users, performers] = await Promise.all([
      this.userService.findByIds(Ids) || [],
      this.performerService.findByIds(Ids) || []
    ]);

    earnings.forEach((earning: ReferralEarningDto) => {
      const registerInfo = users.find((p) => `${p._id}` === `${earning.registerId}`) || performers.find((p) => `${p._id}` === `${earning.registerId}`);
      // eslint-disable-next-line no-param-reassign
      earning.registerInfo = registerInfo ? new UserDto(registerInfo as any).toResponse() : null;
      const referralInfo = users.find((p) => `${p._id}` === `${earning.referralId}`) || performers.find((p) => `${p._id}` === `${earning.referralId}`);
      // eslint-disable-next-line no-param-reassign
      earning.referralInfo = referralInfo ? new UserDto(referralInfo as any).toResponse() : null;
    });
    return {
      data: earnings,
      total
    };
  }

  public async details(id: string) {
    const earning = await this.ReferralEarningModel.findById(toObjectId(id));
    if (!earning) {
      throw new EntityNotFoundException();
    }
    const [performers, users] = await Promise.all([
      this.performerService.findByIds([earning.referralId, earning.registerId]),
      this.userService.findByIds([earning.referralId, earning.registerId])
    ]);
    const data = new ReferralEarningDto(earning);
    const registerInfo = users.find((p) => `${p._id}` === `${earning.registerId}`) || performers.find((p) => `${p._id}` === `${earning.registerId}`);
    data.registerInfo = registerInfo ? new UserDto(registerInfo as any).toResponse() : null;
    const referralInfo = users.find((p) => `${p._id}` === `${earning.referralId}`) || performers.find((p) => `${p._id}` === `${earning.referralId}`);
    data.referralInfo = referralInfo ? new UserDto(referralInfo as any).toResponse() : null;
    return data;
  }

  public async stats(
    req: ReferralEarningSearchRequestPayload
  ): Promise<IReferralEarningStatResponse> {
    const query = {} as any;
    if (req.registerId) {
      query.registerId = toObjectId(req.registerId);
    }
    if (req.referralId) {
      query.referralId = toObjectId(req.referralId);
    }

    const [totalRegisters, totalSales, totalNetPrice, totalTokenNetPrice] = await Promise.all([
      this.referralService.countByQuery(query),
      this.ReferralEarningModel.countDocuments(query),
      this.ReferralEarningModel.aggregate<any>([
        {
          $match: {
            ...query,
            isToken: false
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$netPrice'
            }
          }
        }
      ]),
      this.ReferralEarningModel.aggregate<any>([
        {
          $match: {
            ...query,
            isToken: true
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$netPrice'
            }
          }
        }
      ])
    ]);
    return {
      totalRegisters,
      totalSales,
      totalNetPrice: (totalNetPrice[0] && totalNetPrice[0].total) || 0,
      totalTokenNetPrice: (totalTokenNetPrice[0] && totalTokenNetPrice[0].total) || 0
    };
  }
}
