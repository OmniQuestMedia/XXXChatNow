import {
  Injectable,
  BadRequestException,
  forwardRef,
  Inject
} from '@nestjs/common';
import {
  QueueEventService,
  QueueEvent
} from 'src/kernel';
import { EVENT } from 'src/kernel/constants';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { PerformerService } from 'src/modules/performer/services';
import { MissingConfigPaymentException } from '../exceptions';
import {
  PAYMENT_STATUS,
  TRANSACTION_SUCCESS_CHANNEL
} from '../constants';
import { CCBillService } from './ccbill.service';
import { PaymentTransaction } from '../schemas';
import { OrderDto, PaymentTransactionDto } from '../dtos';
import { OrderService } from './order.service';

const SUPPORTED_GATEWAYS = ['ccbill'];
@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(PaymentTransaction.name) private readonly PaymentTransactionModel: Model<PaymentTransaction>,
    private readonly ccbillService: CCBillService,
    private readonly settingService: SettingService,
    private readonly queueEventService: QueueEventService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService
  ) { }

  public async findById(id: string | ObjectId): Promise<PaymentTransactionDto> {
    const item = await this.PaymentTransactionModel.findById(id);
    if (!item) return null;
    return plainToInstance(PaymentTransactionDto, item.toObject());
  }

  private async _getCCBillSettings() {
    const [
      flexformId,
      subAccountNumber,
      salt,
      currencyCode
    ] = await Promise.all([
      this.settingService.getKeyValue(SETTING_KEYS.CCBILL_FLEXFORM_ID),
      this.settingService.getKeyValue(SETTING_KEYS.CCBILL_SUB_ACCOUNT_NUMBER),
      this.settingService.getKeyValue(SETTING_KEYS.CCBILL_SALT),
      this.settingService.getKeyValue(SETTING_KEYS.CCBILL_CURRENCY_CODE)
    ]);
    if (!flexformId || !subAccountNumber || !salt) {
      throw new MissingConfigPaymentException();
    }

    return {
      flexformId,
      subAccountNumber,
      salt,
      currencyCode
    };
  }

  private async _createTransactionFromOrder(order: OrderDto, paymentGateway = 'ccbill'): Promise<PaymentTransactionDto> {
    const paymentTransaction = new this.PaymentTransactionModel();
    paymentTransaction.orderId = order._id;
    paymentTransaction.paymentGateway = paymentGateway;
    paymentTransaction.buyerSource = order.buyerSource;
    paymentTransaction.buyerId = order.buyerId;
    paymentTransaction.type = order.type;
    paymentTransaction.totalPrice = order.totalPrice;
    paymentTransaction.products = [{
      name: order.name,
      description: order.description,
      price: order.totalPrice,
      productType: order.productType,
      productId: order.productId,
      quantity: order.quantity,
      extraInfo: null
    }];
    paymentTransaction.paymentResponseInfo = null;
    paymentTransaction.status = PAYMENT_STATUS.PENDING;
    await paymentTransaction.save();
    return plainToInstance(PaymentTransactionDto, paymentTransaction.toObject());
  }

  public async processSinglePayment(order: OrderDto, paymentGateway = 'ccbill') {
    if (!SUPPORTED_GATEWAYS.includes(paymentGateway)) throw new BadRequestException(`Does not support payment gateway${paymentGateway}`);

    // TODO - filter for other service
    const ccbillConfig = await this._getCCBillSettings();

    const transaction = await this._createTransactionFromOrder(order, paymentGateway);
    return this.ccbillService.singlePurchase(Object.assign(ccbillConfig, {
      price: transaction.totalPrice,
      transactionId: transaction._id
    }));
  }

  public async ccbillSinglePaymentSuccessWebhook(payload: Record<string, any>) {
    const transactionId = payload['X-transactionId'] || payload.transactionId;
    if (!transactionId) {
      throw new BadRequestException();
    }
    const checkForHexRegExp = /^[0-9a-fA-F]{24}$/;
    if (!checkForHexRegExp.test(transactionId)) {
      return { ok: false };
    }
    const transaction = await this.PaymentTransactionModel.findById(
      transactionId
    );
    if (!transaction || transaction.status !== PAYMENT_STATUS.PENDING) {
      return { ok: false };
    }
    transaction.status = PAYMENT_STATUS.SUCCESS;
    transaction.paymentResponseInfo = payload;
    await transaction.save();
    await this.queueEventService.publish(
      new QueueEvent({
        channel: TRANSACTION_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: transaction
      })
    );
    return { ok: true };
  }

  public async ccbillRenewalSuccessWebhook(payload: any) {
    const subscriptionId = payload.subscriptionId || payload.subscription_id;
    if (!subscriptionId) {
      throw new BadRequestException();
    }
    const transaction = await this.PaymentTransactionModel.findOne({
      'paymentResponseInfo.subscriptionId': subscriptionId
    });
    if (!transaction) {
      return { ok: false };
    }

    // TODO - create new order for this transaction!

    const newTransaction = new this.PaymentTransactionModel(transaction.toObject());
    newTransaction.paymentResponseInfo = payload;
    newTransaction.status = PAYMENT_STATUS.SUCCESS;
    await newTransaction.save();
    await this.queueEventService.publish(
      new QueueEvent({
        channel: TRANSACTION_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: newTransaction
      })
    );
    return { ok: true };
  }
}
