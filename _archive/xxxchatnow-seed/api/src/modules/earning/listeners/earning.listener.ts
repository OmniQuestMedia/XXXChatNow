import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { QueueEventService, QueueEvent } from 'src/kernel';
import {
  PURCHASED_ITEM_SUCCESS_CHANNEL,
  PURCHASE_ITEM_TYPE
} from 'src/modules/purchased-item/constants';
import { EVENT, ROLE } from 'src/kernel/constants';
import {
  PerformerCommissionService,
  PerformerService
} from 'src/modules/performer/services';
import { SettingService } from 'src/modules/settings';
import { PurchasedItemDto } from 'src/modules/purchased-item/dtos';
import { StudioService } from 'src/modules/studio/services';
import { InjectModel } from '@nestjs/mongoose';
import { DBLoggerService } from 'src/modules/logger';
import { ReferralService } from 'src/modules/referral/services/referral.service';
import moment = require('moment');
import { UserService } from 'src/modules/user/services';
import { plainToInstance } from 'class-transformer';
import { PAYMENT_STATUS } from '../../payment/constants';
import { SETTING_KEYS } from '../../settings/constants';
import { EarningDto } from '../dtos/earning.dto';
import { EARNING_CHANNEL } from '../constants';
import { Earning } from '../schemas/earning.schema';
import { ReferralEarning } from '../schemas/referral-earning.schema';

const PURCHASED_ITEM_SUCCESS = 'PURCHASED_ITEM_SUCCESS';
const UPDATED_EARNING_PAID_STATUS = 'UPDATED_EARNING_PAID_STATUS';

@Injectable()
export class TransactionEarningListener {
  constructor(
    @InjectModel(Earning.name) private readonly EarningModel: Model<Earning>,
    @InjectModel(ReferralEarning.name) private readonly ReferralEarningModel: Model<ReferralEarning>,
    private readonly queueEventService: QueueEventService,
    private readonly performerService: PerformerService,
    private readonly userService: UserService,
    private readonly studioService: StudioService,
    private readonly settingService: SettingService,
    private readonly performerCommission: PerformerCommissionService,
    private readonly logger: DBLoggerService,
    private readonly referralService: ReferralService
  ) {
    this.queueEventService.subscribe(
      PURCHASED_ITEM_SUCCESS_CHANNEL,
      PURCHASED_ITEM_SUCCESS,
      this.handleListenEarning.bind(this)
    );
    this.queueEventService.subscribe(
      EARNING_CHANNEL,
      UPDATED_EARNING_PAID_STATUS,
      this.caclBalance.bind(this)
    );
  }

  public async handleListenEarning(event: QueueEvent) {
    try {
      const transaction = event.data as PurchasedItemDto;
      if (
        event.eventName !== EVENT.CREATED
        || transaction?.status !== PAYMENT_STATUS.SUCCESS
      ) {
        return;
      }

      // just support performer item on this time
      const performerId = transaction.sellerId;
      const performer = await this.performerService.findById(performerId);
      if (!performer) {
        return;
      }

      let commission = 0;
      let studioCommision = 0;
      let studioEarning = null;
      const [
        defaultPerformerCommission,
        defaultStudioCommission,
        performerCommission,
        conversionRate
      ] = await Promise.all([
        this.settingService.getKeyValue(SETTING_KEYS.PERFORMER_COMMISSION),
        this.settingService.getKeyValue(SETTING_KEYS.STUDIO_COMMISSION),
        this.performerCommission.findOne({ performerId: performer._id }),
        this.settingService.getKeyValue(SETTING_KEYS.CONVERSION_RATE)
      ]);
      if (performer.studioId) {
        const studio = await this.studioService.findById(performer.studioId);
        studioCommision = studio.commission || defaultStudioCommission;
        commission = performerCommission?.memberCommission || defaultPerformerCommission;
        switch (transaction.type) {
          case PURCHASE_ITEM_TYPE.GROUP:
            studioCommision = studio.groupCallCommission || defaultStudioCommission;
            commission = performerCommission?.groupCallCommission || performerCommission?.memberCommission || defaultPerformerCommission;
            break;
          case PURCHASE_ITEM_TYPE.PRIVATE:
            studioCommision = studio.privateCallCommission || defaultStudioCommission;
            commission = performerCommission?.privateCallCommission || performerCommission?.memberCommission || defaultPerformerCommission;
            break;
          case PURCHASE_ITEM_TYPE.TIP:
            studioCommision = studio.tipCommission || defaultStudioCommission;
            commission = performerCommission?.tipCommission || performerCommission?.memberCommission || defaultPerformerCommission;
            break;
          case PURCHASE_ITEM_TYPE.PRODUCT:
            studioCommision = studio.productCommission || defaultStudioCommission;
            commission = performerCommission?.productCommission || performerCommission?.memberCommission || defaultPerformerCommission;
            break;
          case PURCHASE_ITEM_TYPE.PHOTO:
            studioCommision = studio.albumCommission || defaultStudioCommission;
            commission = performerCommission?.albumCommission || performerCommission?.memberCommission || defaultPerformerCommission;
            break;
          case PURCHASE_ITEM_TYPE.SALE_VIDEO:
            studioCommision = studio.videoCommission || defaultStudioCommission;
            commission = performerCommission?.videoCommission || performerCommission?.memberCommission || defaultPerformerCommission;
            break;
          case PURCHASE_ITEM_TYPE.SPIN_WHEEL:
            studioCommision = studio.spinWheelCommission || defaultStudioCommission;
            commission = performerCommission.spinWheelCommission || performerCommission?.memberCommission || defaultPerformerCommission;
            break;
          default:
            break;
        }

        const newStudioEarning = {
          conversionRate:
            conversionRate || parseInt(process.env.CONVERSION_RATE, 10),
          originalPrice: transaction.totalPrice,
          grossPrice: transaction.totalPrice,
          commission: studioCommision,
          netPrice: transaction.totalPrice * (studioCommision / 100),
          performerId: transaction.sellerId,
          userId: transaction.sourceId,
          transactionTokenId: transaction._id,
          type: transaction.type,
          createdAt: transaction.createdAt,
          transactionStatus: transaction.status,
          sourceId: transaction.sellerId,
          source: ROLE.PERFORMER,
          target: ROLE.STUDIO,
          targetId: performer.studioId
        } as EarningDto;
        studioEarning = await this.EarningModel.create(newStudioEarning);
      } else if (performerCommission) {
        switch (transaction.type) {
          case PURCHASE_ITEM_TYPE.GROUP:
            commission = performerCommission.groupCallCommission;
            break;
          case PURCHASE_ITEM_TYPE.PRIVATE:
            commission = performerCommission.privateCallCommission;
            break;
          case PURCHASE_ITEM_TYPE.TIP:
            commission = performerCommission.tipCommission;
            break;
          case PURCHASE_ITEM_TYPE.PRODUCT:
            commission = performerCommission.productCommission;
            break;
          case PURCHASE_ITEM_TYPE.PHOTO:
            commission = performerCommission.albumCommission;
            break;
          case PURCHASE_ITEM_TYPE.SALE_VIDEO:
            commission = performerCommission.videoCommission;
            break;
          case PURCHASE_ITEM_TYPE.SPIN_WHEEL:
            commission = performerCommission.spinWheelCommission;
            break;
          default:
            break;
        }
      } else {
        commission = defaultPerformerCommission;
      }

      // Performer Earning
      const grossPrice = performer.studioId
        ? transaction.totalPrice * (studioCommision / 100)
        : transaction.totalPrice;
      const netPrice = grossPrice * (commission / 100);
      // eslint-disable-next-line new-cap
      const newEarning = new this.EarningModel();
      newEarning.set(
        'conversionRate',
        conversionRate || parseInt(process.env.CONVERSION_RATE, 10)
      );
      newEarning.set('originalPrice', transaction.totalPrice);
      newEarning.set('grossPrice', grossPrice);
      newEarning.set('commission', commission);
      newEarning.set('netPrice', netPrice);
      newEarning.set('performerId', transaction.sellerId);
      newEarning.set('userId', transaction.sourceId);
      newEarning.set('transactionTokenId', transaction._id);
      newEarning.set('type', transaction.type);
      newEarning.set('createdAt', transaction.createdAt);
      newEarning.set('transactionStatus', transaction.status);
      newEarning.set('sourceId', transaction.sourceId);
      newEarning.set('targetId', transaction.sellerId);
      newEarning.set('source', ROLE.USER);
      newEarning.set('target', ROLE.PERFORMER);

      if (studioEarning) {
        newEarning.set('studioToModel', {
          grossPrice,
          commission,
          netPrice
        });
      }

      const modelEarning = await newEarning.save();

      this.createPerformerReferralEarning(plainToInstance(EarningDto, newEarning.toObject()));
      this.createUserReferralEarning(plainToInstance(EarningDto, newEarning.toObject()));

      // store metadata to studio to model
      if (studioEarning) {
        await this.EarningModel.updateOne(
          { _id: studioEarning._id },
          {
            studioToModel: {
              grossPrice,
              commission,
              netPrice,
              payoutStatus: 'pending',
              refItemId: modelEarning._id
            }
          }
        );
      }
    } catch (e) {
      this.logger.error(e.stack || e);
    }
  }

  private async caclBalance(event: QueueEvent) {
    try {
      const { eventName, data } = event;
      if (eventName !== EVENT.UPDATED) {
        return;
      }

      const { targetId } = data;
      const [performer, studio] = await Promise.all([
        this.performerService.findOne({ _id: targetId }),
        this.studioService.findById(targetId)
      ]);
      if (!performer && !studio) return;

      const result = await this.EarningModel.aggregate([
        {
          $match: {
            targetId: performer?._id || studio?._id,
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
      const balance = (result.length && typeof result[0].total !== 'undefined') ? result[0].total : 0;

      if (performer) await this.performerService.updateBalance(performer._id, balance);
      if (studio) await this.studioService.updateBalance(studio._id, balance);
    } catch (e) {
      this.logger.error(e.stack || e);
    }
  }

  private async createPerformerReferralEarning(earning: EarningDto) {
    const [referralPerformer] = await Promise.all([
      this.referralService.findOne({
        registerId: earning.performerId
      })
    ]);
    if (referralPerformer) {
      const referralEnabled = await this.settingService.getKeyValue(SETTING_KEYS.REFERRAL_ENABLED);
      const optionsReferral = await this.settingService.getKeyValue(SETTING_KEYS.OPTION_FOR_REFERRAL);
      const flatFeeModel = await this.settingService.getKeyValue(SETTING_KEYS.INVITE_MODEL_FLAT_FEE);

      if (referralEnabled) {
        if (optionsReferral === 'flatFee') {
          // earns for 1y
          if (moment().isBefore(moment(referralPerformer.createdAt).subtract(1, 'year'))) return;
          const referralEarning = await this.ReferralEarningModel.create({
            registerSource: referralPerformer.registerSource,
            registerId: earning.performerId,
            referralSource: referralPerformer.referralSource,
            referralId: referralPerformer.referralId,
            earningId: earning._id,
            type: earning.type,
            grossPrice: flatFeeModel,
            netPrice: flatFeeModel,
            isToken: true,
            isPaid: true,
            paidAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            transactionStatus: earning.transactionStatus
          });

          // update referral balance
          referralEarning.referralSource === 'performer' && await this.performerService.increaseBalance(referralEarning.referralId, referralEarning.netPrice);
          referralEarning.referralSource === 'user' && await this.userService.increaseBalance(referralEarning.referralId, referralEarning.netPrice);
        } else {
        // earns for 1y
          if (moment().isBefore(moment(referralPerformer.createdAt).subtract(1, 'year'))) return;
          const referralCommission = SettingService.getValueByKey(SETTING_KEYS.PERFORMER_REFERRAL_COMMISSION) || 0.05;
          const referralEarning = await this.ReferralEarningModel.create({
            registerSource: referralPerformer.registerSource,
            registerId: earning.performerId,
            referralSource: referralPerformer.referralSource,
            referralId: referralPerformer.referralId,
            earningId: earning._id,
            type: earning.type,
            grossPrice: earning.netPrice,
            netPrice: earning.netPrice * (referralCommission / 100),
            referralCommission,
            isToken: true,
            isPaid: true,
            paidAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            transactionStatus: earning.transactionStatus
          });

          // update referral balance
          referralEarning.referralSource === 'performer' && await this.performerService.increaseBalance(referralEarning.referralId, referralEarning.netPrice);
          referralEarning.referralSource === 'user' && await this.userService.increaseBalance(referralEarning.referralId, referralEarning.netPrice);
        }
      }
    }
  }

  private async createUserReferralEarning(earning: EarningDto) {
    const [referralUser] = await Promise.all([
      this.referralService.findOne({
        registerId: earning.userId
      })
    ]);
    if (referralUser) {
      const referralEnabled = await this.settingService.getKeyValue(SETTING_KEYS.REFERRAL_ENABLED);

      const optionsReferral = await this.settingService.getKeyValue(SETTING_KEYS.OPTION_FOR_REFERRAL);
      const flatFeeUser = await this.settingService.getKeyValue(SETTING_KEYS.INVITE_USER_FLAT_FEE);
      if (referralEnabled) {
        if (optionsReferral === 'flatFee') {
          const referralEarning = await this.ReferralEarningModel.create({
            registerSource: referralUser.registerSource,
            registerId: earning.userId,
            referralSource: referralUser.referralSource,
            referralId: referralUser.referralId,
            earningId: earning._id,
            type: earning.type,
            grossPrice: flatFeeUser,
            netPrice: flatFeeUser,
            isPaid: true,
            isToken: true,
            paidAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            transactionStatus: earning.transactionStatus
          });
          // update referral balance
          referralEarning.referralSource === 'performer' && await this.performerService.increaseBalance(referralEarning.referralId, referralEarning.netPrice);
          referralEarning.referralSource === 'user' && await this.userService.increaseBalance(referralEarning.referralId, referralEarning.netPrice);
        } else {
          const referralCommission = SettingService.getValueByKey(SETTING_KEYS.USER_REFERRAL_COMMISSION) || 0.01;
          const referralEarning = await this.ReferralEarningModel.create({
            registerSource: referralUser.registerSource,
            registerId: earning.userId,
            referralSource: referralUser.referralSource,
            referralId: referralUser.referralId,
            earningId: earning._id,
            type: earning.type,
            grossPrice: earning.grossPrice,
            netPrice: earning.grossPrice * (referralCommission / 100),
            referralCommission,
            isPaid: true,
            isToken: true,
            paidAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            transactionStatus: earning.transactionStatus
          });
          // update referral balance
          referralEarning.referralSource === 'performer' && await this.performerService.increaseBalance(referralEarning.referralId, referralEarning.netPrice);
          referralEarning.referralSource === 'user' && await this.userService.increaseBalance(referralEarning.referralId, referralEarning.netPrice);
        }
      }
    }
  }
}
