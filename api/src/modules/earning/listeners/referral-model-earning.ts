/* eslint-disable new-cap */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { EVENT, ROLE } from 'src/kernel/constants';
import { SettingService } from 'src/modules/settings/services';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { PerformerService } from 'src/modules/performer/services';
import { PurchaseItemService } from 'src/modules/purchased-item/services';
import { REFERRAL_CHANNEL } from 'src/modules/referral/contants';
import { ReferralService } from 'src/modules/referral/services/referral.service';
import moment = require('moment');
import { UserService } from 'src/modules/user/services';
import { InjectModel } from '@nestjs/mongoose';
import { Earning } from '../schemas/earning.schema';
import { ReferralEarning } from '../schemas/referral-earning.schema';

const REFERRAL_EARNING_CHANNEL = 'REFERRAL_EARNING_CHANNEL';

@Injectable()
export class ReferralEarningListener {
  constructor(
    @InjectModel(Earning.name) private readonly EarningModel: Model<Earning>,
    @InjectModel(ReferralEarning.name) private readonly ReferralEarningModel: Model<ReferralEarning>,

    private readonly queueEventService: QueueEventService,
    private readonly settingService: SettingService,
    private readonly performerService: PerformerService,
    private readonly userService: UserService,
    private readonly purchaseItemService: PurchaseItemService,
    private readonly referralService: ReferralService
  ) {
    this.queueEventService.subscribe(
      REFERRAL_CHANNEL,
      REFERRAL_EARNING_CHANNEL,
      this.handleListen.bind(this)
    );
  }

  public async handleListen(event: QueueEvent) {
    const {
      eventName,
      data: { referral, memberRoles }
    } = event;
    if (eventName !== EVENT.CREATED) {
      return;
    }
    try {
      const [
        conversionRate
      ] = await Promise.all([
        this.settingService.getKeyValue(SETTING_KEYS.CONVERSION_RATE)
      ]);

      const reward = memberRoles === 'user'
        ? await this.settingService.getKeyValue(
          SETTING_KEYS.INVITE_USER_FLAT_FEE
        )
        : await this.settingService.getKeyValue(
          SETTING_KEYS.INVITE_MODEL_FLAT_FEE
        );

      const transaction = await this.purchaseItemService.receiveReferralModel(referral.registerId, referral.referralId, reward);
      const newEarning = new this.EarningModel();
      newEarning.set(
        'conversionRate',
        conversionRate || parseInt(process.env.CONVERSION_RATE, 10)
      );
      newEarning.set('originalPrice', reward);
      newEarning.set('grossPrice', reward);
      newEarning.set('commission', 0);
      newEarning.set('netPrice', reward);
      newEarning.set('performerId', referral.registerId);
      newEarning.set('userId', referral.referralId);
      newEarning.set('transactionTokenId', transaction._id);
      newEarning.set('type', transaction.type);
      newEarning.set('createdAt', transaction.createdAt);
      newEarning.set('transactionStatus', transaction.status);
      newEarning.set('sourceId', transaction.sourceId);
      newEarning.set('targetId', transaction.sellerId);
      newEarning.set('source', 'system');
      newEarning.set('target', ROLE.PERFORMER);
      // eslint-disable-next-line no-await-in-loop
      await newEarning.save();

      const [referralPerformer] = await Promise.all([
        this.referralService.findOne({
          registerId: newEarning.performerId
        })
      ]);

      if (referralPerformer) {
        const referralEnabled = await this.settingService.getKeyValue(SETTING_KEYS.REFERRAL_ENABLED);
        if (referralEnabled) {
          // earns for 1y
          if (moment().isBefore(moment(referralPerformer.createdAt).subtract(1, 'year'))) return;
          // const referralCommission = SettingService.getValueByKey(SETTING_KEYS.PERFORMER_REFERRAL_COMMISSION) || 0.05;
          const referralEarning = await this.ReferralEarningModel.create({
            registerSource: referral.registerSource === 'performer' ? 'performer' : 'user',
            registerId: referral.registerId,
            referralSource: referralPerformer.referralSource,
            referralId: referralPerformer.referralId,
            earningId: newEarning._id,
            type: newEarning.type,
            grossPrice: newEarning.netPrice,
            netPrice: newEarning.netPrice,
            // referralCommission,
            isPaid: true,
            isToken: true,
            paidAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            transactionStatus: newEarning.transactionStatus
          });
          await referralEarning.save();
        }
        if (referral.referralSource === 'user') {
          await this.userService.increaseBalance(referral.referralId, reward);
        } else if (referral.referralSource === 'performer') {
          await this.performerService.increaseBalance(referral.referralId, reward);
          await this.performerService.updateStats(referral.referralId, { 'stats.totalTokenEarned': reward });
        }
      }
    } catch (error) {
      const err = await Promise.resolve(error);
      console.log('Referral channel for earning error', err);
    }
  }
}
