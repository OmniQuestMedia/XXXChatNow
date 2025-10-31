import { Injectable } from '@nestjs/common';
import { Model, SortOrder } from 'mongoose';
import {
  EntityNotFoundException,
  PageableData,
  QueueEventService
} from 'src/kernel';
import { toObjectId } from 'src/kernel/helpers/string.helper';
import { StudioService } from 'src/modules/studio/services';
import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import * as moment from 'moment';
import { EVENT, ROLE } from 'src/kernel/constants';
import { STATUES } from 'src/modules/payout-request/constants';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { PayoutRequestDto } from 'src/modules/payout-request/dtos/payout-request.dto';
import { PerformerDto } from 'src/modules/performer/dtos';
import { StudioDto } from 'src/modules/studio/dtos';
import {
  EarningSearchRequestPayload,
  UpdateEarningStatusPayload
} from '../payloads';
import { UserDto } from '../../user/dtos';
import { UserService } from '../../user/services';
import { PerformerService } from '../../performer/services';
import {
  EarningDto,
  IEarningStatResponse
} from '../dtos/earning.dto';
import { PurchaseItemService } from '../../purchased-item/services';
import { EARNING_CHANNEL } from '../constants';
import { Earning } from '../schemas/earning.schema';

@Injectable()
export class EarningService {
  constructor(
    @InjectModel(Earning.name) private readonly EarningModel: Model<Earning>,
    private readonly userService: UserService,
    private readonly performerService: PerformerService,
    private readonly studioService: StudioService,
    private readonly paymentService: PurchaseItemService,
    private readonly queueEventService: QueueEventService
  ) { }

  public async search(
    req: EarningSearchRequestPayload,
    user?: UserDto
  ): Promise<PageableData<Partial<EarningDto>>> {
    const query = {} as any;
    if (req.performerId) query.performerId = toObjectId(req.performerId);
    if (req.targetId) query.targetId = toObjectId(req.targetId);
    if (req.sourceId) query.sourceId = toObjectId(req.sourceId);
    if (req.source) query.source = req.source;
    if (req.target) query.target = req.target;
    if (req.type) query.type = req.type;
    if (req.payoutStatus) query.payoutStatus = req.payoutStatus;

    if (!req.performerId && req.performerType === 'individual') {
      const performers = await this.performerService.findAllIndividualPerformers();
      const ids = performers.map((p) => p._id);
      query.performerId = {
        $in: ids
      };
    }

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
        $gt: moment(req.fromDate)
          .startOf('day')
          .toDate(),
        $lte: moment(req.toDate)
          .endOf('day')
          .toDate()
      };
    }

    const [data, total] = await Promise.all([
      this.EarningModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.EarningModel.countDocuments(query)
    ]);

    const includePrivateInfo = user && user.roles && user.roles.includes('admin');
    const sources = data.map((d) => ({
      id: d.sourceId,
      role: d.source
    }));
    const targets = data.map((d) => ({
      id: d.targetId,
      role: d.target
    }));
    const users = [...sources, ...targets];
    const userInfos = await Promise.all(
      users.map((u) => this.getInfo(u.id, u.role))
    );

    const earnings = data.map((earning) => {
      const {
        sourceId, targetId, conversionRate, netPrice
      } = earning;
      const sourceInfo = userInfos.find(
        (s) => s._id.toString() === sourceId.toString()
      );
      const targetInfo = userInfos.find(
        (t) => t._id.toString() === targetId.toString()
      );

      const dto = plainToInstance(EarningDto, earning);
      if (targetInfo && targetInfo._id) {
        dto.setTargetInfo(targetInfo as UserDto | PerformerDto | StudioDto);
      }
      if (sourceInfo && sourceInfo._id) {
        dto.setSourceInfo(sourceInfo as UserDto | PerformerDto | StudioDto);
      }
      dto.price = conversionRate && conversionRate * netPrice;
      return dto;
    });

    return {
      total,
      data: earnings.map((e) => e.toResponse(includePrivateInfo))
    };
  }

  async getInfo(id: string | ObjectId, role: string) {
    if (role === ROLE.PERFORMER) {
      return this.performerService.findById(id);
    }

    if (role === ROLE.STUDIO) {
      return this.studioService.findById(id);
    }

    if (role === ROLE.USER) {
      const user = await this.userService.findById(id);
      return new UserDto(user).toResponse(true);
    }

    return null;
  }

  public async details(id: string) {
    const earning = await this.EarningModel.findById(toObjectId(id));
    const transaction = await this.paymentService.findById(
      earning.transactionTokenId
    );
    if (!earning || !transaction) {
      throw new EntityNotFoundException();
    }
    const [user, performer] = await Promise.all([
      this.userService.findById(earning.userId),
      this.performerService.findById(earning.performerId)
    ]);
    const data = new EarningDto(earning);
    data.setUserInfo(user);
    data.setPerformerInfo(performer);
    data.setTransactioInfo(transaction);
    return data;
  }

  public async adminStats(
    req: EarningSearchRequestPayload
  ): Promise<IEarningStatResponse> {
    const query = {} as any;
    if (req.performerId) query.performerId = toObjectId(req.performerId);
    if (req.sourceId) query.sourceType = toObjectId(req.sourceId);
    if (req.targetId) query.targetId = toObjectId(req.targetId);
    if (req.source) query.source = req.source;
    if (req.target) query.target = req.target;
    if (req.type) query.type = req.type;
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: moment(req.fromDate)
          .startOf('day')
          .toDate(),
        $lte: moment(req.toDate)
          .endOf('day')
          .toDate()
      };
    }

    if (!req.performerId && req.performerType === 'individual') {
      const performers = await this.performerService.findAllIndividualPerformers();
      const ids = performers.map((p) => p._id);
      query.performerId = {
        $in: ids
      };
    }

    const [
      totalPrice,
      paidPrice,
      remainingPrice,
      sharedPrice
    ] = await Promise.all([
      this.EarningModel.aggregate([
        {
          $match: query
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$grossPrice'
            }
          }
        }
      ]),
      this.EarningModel.aggregate([
        {
          $match: { ...query, isPaid: true }
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
      this.EarningModel.aggregate([
        {
          $match: { ...query, isPaid: false }
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
      this.EarningModel.aggregate([
        {
          $match: { ...query }
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
      totalPrice: (totalPrice.length && totalPrice[0].total) || 0,
      paidPrice: (paidPrice.length && paidPrice[0].total) || 0,
      remainingPrice: (remainingPrice.length && remainingPrice[0].total) || 0,
      sharedPrice: (sharedPrice.length && sharedPrice[0].total) || 0
    };
  }

  public async stats(
    req: EarningSearchRequestPayload,
    options?: any
  ): Promise<IEarningStatResponse> {
    const query = {} as any;
    if (req.performerId) query.performerId = toObjectId(req.performerId);
    if (req.sourceId) query.sourceType = toObjectId(req.sourceId);
    if (req.targetId) query.targetId = toObjectId(req.targetId);
    if (req.source) query.source = req.source;
    if (req.target) query.target = req.target;
    if (req.type) query.type = req.type;
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: moment(req.fromDate)
          .startOf('day')
          .toDate(),
        $lte: moment(req.toDate)
          .endOf('day')
          .toDate()
      };
    }

    const [totalPrice, paidPrice, remainingPrice] = await Promise.all([
      this.EarningModel.aggregate([
        {
          $match: query
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$grossPrice'
            }
          }
        }
      ]),
      this.EarningModel.aggregate([
        {
          $match: { ...query, isPaid: true }
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
      this.EarningModel.aggregate([
        {
          $match: { ...query, isPaid: false }
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

    let studioToModel;
    let studioToModel2;
    if (options?.includingStudioEarning) {
      studioToModel = await this.EarningModel.aggregate([
        {
          $match: {
            ...query,
            isPaid: false
          }
        },
        {
          $group: {
            _id: null,
            totalGross: {
              $sum: '$studioToModel.grossPrice'
            },
            totalNet: {
              $sum: '$studioToModel.netPrice'
            }
          }
        }
      ]);

      studioToModel2 = await this.EarningModel.aggregate([
        {
          $match: query
        },
        {
          $group: {
            _id: null,
            totalGross: {
              $sum: '$studioToModel.grossPrice'
            },
            totalNet: {
              $sum: '$studioToModel.netPrice'
            }
          }
        }
      ]);
    }

    const result = {
      totalPrice: (totalPrice.length && totalPrice[0].total) || 0,
      paidPrice: (paidPrice.length && paidPrice[0].total) || 0,
      remainingPrice: (remainingPrice.length && remainingPrice[0].total) || 0
    } as any;
    if (options?.includingStudioEarning) {
      result.studioToModelTotalUnpaidGrossPrice = studioToModel?.length ? studioToModel[0].totalGross : 0;
      result.studioToModelTotalUnpaidNetPrice = studioToModel?.length ? studioToModel[0].totalNet : 0;
      result.studioToModelTotalGrossPrice = studioToModel2?.length ? studioToModel2[0].totalGross : 0;
      result.studioToModelTotalNetPrice = studioToModel2?.length ? studioToModel2[0].totalNet : 0;
    }
    return result;
  }

  public async calculatePayoutRequestStats(q) {
    const query = {} as any;
    if (q.performerId) {
      query.performerId = toObjectId(q.performerId);
    }
    if (q.userId) {
      query.userId = toObjectId(q.userId);
    }
    if (q.targetId) {
      query.targetId = toObjectId(q.targetId);
    }
    if (q.fromDate && q.toDate) {
      query.createdAt = {
        $gt: moment(q.fromDate)
          // .startOf('day')
          .toDate(),
        $lte: moment(q.toDate)
          // .endOf('day')
          .toDate()
      };
    }

    const [totalEarning, totalPrice, paidPrice, remainingPrice] = await Promise.all([
      this.EarningModel.aggregate([
        {
          $match: { ...query }
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
      this.EarningModel.aggregate([
        {
          $match: { ...query, isPaid: false }
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
      this.EarningModel.aggregate([
        {
          $match: { ...query, isPaid: true, payoutStatus: 'approved' }
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
      this.EarningModel.aggregate([
        {
          $match: { ...pick(query, 'targetId'), isPaid: false }
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
      totalEarning: (totalEarning.length && totalEarning[0].total) || 0,
      totalPrice: (totalPrice.length && totalPrice[0].total) || 0,
      paidPrice: (paidPrice.length && paidPrice[0].total) || 0,
      remainingPrice: (remainingPrice.length && remainingPrice[0].total) || 0
    };
  }

  public async updatePaidStatus(
    payload: UpdateEarningStatusPayload
  ): Promise<any> {
    const query: Record<string, any> = {
      targetId: payload.targetId,
      createdAt: {
        $gt: new Date(payload.fromDate),
        $lte: new Date(payload.toDate)
      }
    };

    await this.EarningModel.updateMany(query, {
      $set: {
        isPaid: true,
        paidAt: new Date(),
        updatedAt: new Date(),
        payoutStatus: STATUES.DONE
      }
    });

    await this.queueEventService.publish({
      eventName: EVENT.UPDATED,
      channel: EARNING_CHANNEL,
      data: {
        targetId: payload.targetId
      }
    });

    return true;
  }

  public async updateRejectStatus(
    payload: UpdateEarningStatusPayload
  ): Promise<any> {
    const query = {
      targetId: payload.targetId,
      createdAt: {
        $gt: new Date(payload.fromDate),
        $lte: new Date(payload.toDate)
      }
    } as any;

    await this.EarningModel.updateMany(query, {
      $set: {
        updatedAt: new Date(),
        payoutStatus: STATUES.REJECTED
      }
    });

    await this.queueEventService.publish({
      eventName: EVENT.UPDATED,
      channel: EARNING_CHANNEL,
      data: {
        targetId: payload.targetId
      }
    });

    return true;
  }

  public async updateApprovedStatus(
    payload: UpdateEarningStatusPayload
  ): Promise<any> {
    const query = {
      targetId: payload.targetId,
      createdAt: {
        $gt: new Date(payload.fromDate),
        $lte: new Date(payload.toDate)
      }
    } as any;

    await this.EarningModel.updateMany(query, {
      $set: {
        updatedAt: new Date(),
        isPaid: true,
        payoutStatus: STATUES.APPROVED
      }
    });

    await this.queueEventService.publish({
      eventName: EVENT.UPDATED,
      channel: EARNING_CHANNEL,
      data: {
        targetId: payload.targetId
      }
    });

    return true;
  }

  public async updateRefItemsStudioToModel(request: PayoutRequestDto, status: string) {
    const earnings = await this.EarningModel.find({
      targetId: request.sourceId,
      createdAt: {
        $gt: new Date(request.fromDate),
        $lte: new Date(request.toDate)
      }
    }).select('_id');
    await earnings.reduce(async (lp, earning) => {
      await lp;
      await this.EarningModel.updateOne({
        'studioToModel.refItemId': earning._id
      }, {
        $set: {
          'studioToModel.payoutStatus': status
        }
      });
      return Promise.resolve();
    }, Promise.resolve());
  }

  async getTotalPendingToken(performerId: string | ObjectId) {
    const performer = await this.performerService.findById(performerId);
    if (!performer) throw new EntityNotFoundException();

    const data = await this.EarningModel.aggregate([
      {
        $match: {
          targetId: performer._id,
          target: ROLE.PERFORMER,
          isPaid: false
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
    ]);

    return {
      total: (data.length && data[0].total) || 0
    };
  }

  public async getTotalGrossPrice(): Promise<number> {
    const res = await this.EarningModel.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: '$grossPrice'
          }
        }
      }
    ]);
    return res?.length ? res[0].total : 0;
  }

  public async getTotalNetPrice(): Promise<number> {
    const res = await this.EarningModel.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: '$netPrice'
          }
        }
      }
    ]);
    return res?.length ? res[0].total : 0;
  }
}
