import {
  Injectable, Inject, forwardRef
} from '@nestjs/common';
import { Model } from 'mongoose';
import { PerformerService } from 'src/modules/performer/services';
import { UserDto } from 'src/modules/user/dtos';
import { StringHelper } from 'src/kernel';
import { UserService } from 'src/modules/user/services';
import * as moment from 'moment';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { ReferralDto } from '../dtos/referral.dto';
import { NewReferralUserPayload, ReferralSearch, ReferralStats } from '../payloads/referral.payload';
import { ReferralCode, ReferralUser } from '../schemas/referral.schema';

@Injectable()
export class ReferralService {
  constructor(
    @InjectModel(ReferralUser.name) private readonly ReferralUserModel: Model<ReferralUser>,
    @InjectModel(ReferralCode.name) private readonly ReferralCodeModel: Model<ReferralCode>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService
  ) { }

  public async newReferral(payload: NewReferralUserPayload): Promise<ReferralDto> {
    const refCode = await this.ReferralCodeModel.findOne({
      code: payload.code
    });

    if (!refCode) return;
    const referral = await this.ReferralUserModel.findOne({
      registerSource: payload.registerSource,
      registerId: payload.registerId.toString(),
      referralSource: refCode.source,
      referralId: refCode.sourceId.toString()
    });

    if (referral) return;
    await this.ReferralUserModel.create({
      registerSource: payload.registerSource,
      registerId: payload.registerId,
      referralSource: refCode.source,
      referralId: refCode.sourceId,
      createdAt: new Date()
    });
  }

  public async findOne(query: any): Promise<ReferralDto> {
    const referral = await this.ReferralUserModel.findOne(query);
    if (!referral) return null;
    return plainToInstance(ReferralDto, referral.toObject());
  }

  public async countByQuery(query: any): Promise<number> {
    return this.ReferralUserModel.countDocuments(query);
  }

  private async getCode() {
    const code = StringHelper.randomString(12);
    const data = await this.ReferralCodeModel.findOne({
      code
    });
    if (data) {
      const newData = await this.getCode();
      return newData;
    }
    return code;
  }

  public async userCode(user: UserDto) {
    const data = await this.ReferralCodeModel.findOne({
      sourceId: user._id
    });
    if (data) {
      return data.code;
    }
    const code = await this.getCode();
    const newData = await this.ReferralCodeModel.create({
      source: user.isPerformer ? 'performer' : 'user',
      sourceId: user._id,
      code,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return newData.code;
  }

  public async adminStats(req: ReferralStats) {
    const query = {} as any;
    if (req.referralId) {
      query.referralId = req.referralId;
    }

    const [totalRegister] = await Promise.all([
      this.ReferralUserModel.countDocuments(query)
    ]);
    return {
      totalRegister
    };
  }

  public async search(
    req: ReferralSearch
  ) {
    const query = {} as any;
    if (req.referralId) {
      query.referralId = req.referralId;
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
      this.ReferralUserModel
        .find(query)
        .sort(sort)
        .limit(+req.limit)
        .skip(+req.offset),
      this.ReferralUserModel.countDocuments(query)
    ]);

    const referralIds = data.map((d) => d.referralId);
    const registerIds = data.map((d) => d.registerId);
    const Ids = referralIds.concat(registerIds);
    const [users, performers] = await Promise.all([
      Ids.length ? this.userService.findByIds(Ids) : [],
      Ids.length ? this.performerService.findByIds(Ids) : []
    ]);

    const results = data.map((d) => new ReferralDto(d));

    results.forEach((d) => {
      const register = users.find((r) => `${r._id}` === `${d.registerId}`) || performers.find((r) => `${r._id}` === `${d.registerId}`);
      const referral = users.find((r) => `${r._id}` === `${d.referralId}`) || performers.find((r) => `${r._id}` === `${d.referralId}`);
      // eslint-disable-next-line no-param-reassign
      d.referralInfo = referral ? new UserDto(referral as any).toResponse() : null;
      // eslint-disable-next-line no-param-reassign
      d.registerInfo = register ? new UserDto(register as any).toResponse() : null;
    });
    return {
      data: results,
      total
    };
  }
}
