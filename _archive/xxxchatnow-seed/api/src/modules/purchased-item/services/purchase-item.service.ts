import {
  Injectable, Inject, forwardRef, BadRequestException
} from '@nestjs/common';
import { UserDto } from 'src/modules/user/dtos';
import {
  EntityNotFoundException,
  QueueEventService,
  QueueEvent
} from 'src/kernel';
import { EVENT, ROLE } from 'src/kernel/constants';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  ProductService,
  GalleryService,
  VideoService
} from 'src/modules/performer-assets/services';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { PerformerService } from 'src/modules/performer/services';
import { PRODUCT_TYPE } from 'src/modules/performer-assets/constants';
import { ConversationService } from 'src/modules/message/services';
import { InjectModel } from '@nestjs/mongoose';
import { Crowdfunding } from 'src/modules/crowdfunding/schemas';
import { STREAM_GOAL_CHANNEL } from 'src/modules/stream/constant';
import { OrderService } from 'src/modules/payment/services';
import { UserService } from 'src/modules/user/services';
import { StreamPeekInService } from 'src/modules/stream/services';
import {
  PurchaseProductsPayload, SendContributePayload, SendTipsPayload
} from '../payloads';

import {
  ItemHaveBoughtException,
  ItemNotForSaleException,
  NotEnoughMoneyException,
  OverProductStockException
} from '../exceptions';
import {
  PURCHASE_ITEM_TYPE,
  PURCHASE_ITEM_TARGET_TYPE,
  PURCHASED_ITEM_SUCCESS_CHANNEL,
  PURCHASE_ITEM_STATUS
} from '../constants';
import { PurchasedItem } from '../schemas';
import { PurchasedItemDto } from '../dtos';

@Injectable()
export class PurchaseItemService {
  constructor(
    @InjectModel(PurchasedItem.name) private readonly PurchasedItemModel: Model<PurchasedItem>,
    @InjectModel(Crowdfunding.name) private readonly CrowdfundingModel: Model<Crowdfunding>,

    @Inject(forwardRef(() => QueueEventService))
    private readonly queueEventService: QueueEventService,
    @Inject(forwardRef(() => VideoService))
    private readonly videoService: VideoService,
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => GalleryService))
    private readonly galleryService: GalleryService,
    @Inject(forwardRef(() => ConversationService))
    private readonly conversationService: ConversationService,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
    @Inject(forwardRef(() => StreamPeekInService))
    private readonly streamPeekInService: StreamPeekInService
  ) { }

  public async findById(id: string | ObjectId): Promise<PurchasedItemDto> {
    const item = await this.PurchasedItemModel.findById(id);
    if (!item) return null;
    return PurchasedItemDto.fromModel(item);
  }

  public async purchaseProduct(
    id: string | ObjectId,
    user: UserDto,
    payload: PurchaseProductsPayload
  ): Promise<PurchasedItemDto> {
    const product = await this.productService.getDetails(id);
    if (!product) throw new EntityNotFoundException();

    let transaction = product.type === PRODUCT_TYPE.DIGITAL
      && (await this.PurchasedItemModel.findOne({
        sourceId: user._id,
        targetId: product._id,
        status: PURCHASE_ITEM_STATUS.SUCCESS
        // type: PURCHASE_ITEM_TYPE.PRODUCT // do not need type, since we do not index type, it is not needed in this case
      }));
    if (transaction) {
      throw new ItemHaveBoughtException();
    }

    const quantity = payload?.quantity || 1;
    const purchaseToken = product.type === PRODUCT_TYPE.DIGITAL
      ? product.token
      : product.token * quantity;
    if (user.balance < purchaseToken) throw new NotEnoughMoneyException();

    if (product.type === PRODUCT_TYPE.PHYSICAL && quantity > product.stock) {
      throw new OverProductStockException();
    }

    transaction = new this.PurchasedItemModel({
      source: 'user',
      sourceId: user._id,
      target: PURCHASE_ITEM_TARGET_TYPE.PRODUCT,
      targetId: product._id,
      sellerId: product.performerId,
      type: PURCHASE_ITEM_TYPE.PRODUCT,
      totalPrice: purchaseToken,
      originalPrice: purchaseToken,
      name: product.name,
      description: `Purchase product ${product.name} (x${quantity})`,
      quantity,
      payBy: 'token',
      extraInfo: payload,
      status: PURCHASE_ITEM_STATUS.SUCCESS
    });
    await transaction.save();

    const dto = PurchasedItemDto.fromModel(transaction);
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: dto
      })
    );

    return dto;
  }

  public async purchaseVideo(id: string | ObjectId, user: UserDto): Promise<PurchasedItemDto> {
    const video = await this.videoService.findById(id);
    if (!video) throw new EntityNotFoundException();

    if (!video.isSaleVideo) throw new ItemNotForSaleException();

    let transaction = await this.PurchasedItemModel.findOne({
      sourceId: user._id,
      targetId: video._id,
      status: PURCHASE_ITEM_STATUS.SUCCESS
    });
    if (transaction) {
      throw new ItemHaveBoughtException();
    }

    if (user.balance < video.token) throw new NotEnoughMoneyException();
    transaction = new this.PurchasedItemModel({
      source: 'user',
      sourceId: user._id,
      target: PURCHASE_ITEM_TARGET_TYPE.VIDEO,
      targetId: video._id,
      sellerId: video.performerId,
      type: PURCHASE_ITEM_TYPE.SALE_VIDEO,
      totalPrice: video.token,
      originalPrice: video.token,
      name: video.title,
      description: `Purchase video ${video.title}`,
      quantity: 1,
      payBy: 'token',
      status: PURCHASE_ITEM_STATUS.SUCCESS
    });
    await transaction.save();
    const dto = PurchasedItemDto.fromModel(transaction);
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: dto
      })
    );
    return dto;
  }

  public async buyPhotoGallery(id: string | ObjectId, user: UserDto): Promise<PurchasedItemDto> {
    const gallery = await this.galleryService.findById(id);
    if (!gallery) throw new EntityNotFoundException();
    if (!gallery.isSale) throw new ItemNotForSaleException();

    let transaction = await this.PurchasedItemModel.findOne({
      sourceId: user._id,
      targetId: gallery._id,
      status: PURCHASE_ITEM_STATUS.SUCCESS
    });
    if (transaction) throw new ItemHaveBoughtException();

    if (user.balance < gallery.token) throw new NotEnoughMoneyException();
    transaction = new this.PurchasedItemModel({
      source: 'user',
      sourceId: user._id,
      target: PURCHASE_ITEM_TARGET_TYPE.PHOTO,
      targetId: gallery._id,
      sellerId: gallery.performerId,
      type: PURCHASE_ITEM_TYPE.PHOTO,
      totalPrice: gallery.token,
      originalPrice: gallery.token,
      name: gallery.name,
      description: `Purchase gallery ${gallery.name}`,
      quantity: 1,
      payBy: 'token',
      status: PURCHASE_ITEM_STATUS.SUCCESS
    });
    await transaction.save();
    const dto = PurchasedItemDto.fromModel(transaction);
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: dto
      })
    );
    return dto;
  }

  async sendTips(user: UserDto, performerId: string, payload: SendTipsPayload) {
    const performer = await this.performerService.findById(performerId);
    if (!performer) {
      throw new EntityNotFoundException();
    }

    // if (!performer.isOnline) {
    //   throw new PerformerOfflineException();
    // }

    if (user.balance < payload.token) {
      throw new BadRequestException(
        'The selected tipping amount is more than your account token balance'
      );
    }

    const paymentTransaction = new this.PurchasedItemModel();
    paymentTransaction.originalPrice = payload.token;
    paymentTransaction.totalPrice = payload.token;
    paymentTransaction.source = ROLE.USER;
    paymentTransaction.sourceId = user._id;
    paymentTransaction.target = PURCHASE_ITEM_TARGET_TYPE.TIP;
    paymentTransaction.sellerId = performer._id;
    paymentTransaction.targetId = new ObjectId(payload.conversationId);
    paymentTransaction.type = PURCHASE_ITEM_TYPE.TIP;
    paymentTransaction.name = 'tip';
    paymentTransaction.status = PURCHASE_ITEM_STATUS.SUCCESS;
    await paymentTransaction.save();
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: paymentTransaction
      })
    );

    await this.queueEventService.publish(
      new QueueEvent({
        channel: STREAM_GOAL_CHANNEL,
        eventName: EVENT.CREATED,
        data: {
          token: paymentTransaction.totalPrice,
          performerId: performer._id,
          conversationId: paymentTransaction.targetId
        }
      })
    );

    return paymentTransaction;
  }

  async spinWheel({
    token,
    userId,
    performerId,
    name,
    wheelResultId,
    conversationId
  }) {
    const performer = await this.performerService.findById(performerId);

    if (!performer) {
      throw new EntityNotFoundException();
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new EntityNotFoundException();
    }

    if (user.balance < token) {
      throw new NotEnoughMoneyException();
    }

    const paymentTransaction = new this.PurchasedItemModel();
    paymentTransaction.originalPrice = token;
    paymentTransaction.totalPrice = token;
    paymentTransaction.source = ROLE.USER;
    paymentTransaction.sourceId = user._id;
    paymentTransaction.target = PURCHASE_ITEM_TARGET_TYPE.SPIN_WHEEL;
    paymentTransaction.sellerId = performer._id;
    paymentTransaction.targetId = new ObjectId(wheelResultId);
    paymentTransaction.type = PURCHASE_ITEM_TYPE.SPIN_WHEEL;
    paymentTransaction.status = PURCHASE_ITEM_STATUS.SUCCESS;
    paymentTransaction.name = name;
    paymentTransaction.extraInfo = {
      conversationId
    };
    paymentTransaction.description = `Spined wheel when watching ${performer.username}'s stream with result: "${name}"`;
    await paymentTransaction.save();
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: paymentTransaction
      })
    );
    return paymentTransaction;
  }

  public async sendPaidToken(user: UserDto, conversationId: string): Promise<PurchasedItemDto> {
    const conversation = await this.conversationService.findById(conversationId);
    if (!conversation) throw new EntityNotFoundException();

    const { performerId, type } = conversation;
    const performer = await this.performerService.findById(conversation.performerId);
    if (!performer) throw new EntityNotFoundException();

    let token: number;
    let key: string;
    switch (conversation.type) {
      case 'stream_group':
        token = performer.groupCallPrice;
        key = SETTING_KEYS.GROUP_CHAT_DEFAULT_PRICE;
        break;
      case 'stream_private':
        token = performer.privateCallPrice;
        key = SETTING_KEYS.PRIVATE_C2C_PRICE;
        break;
      default:
        key = SETTING_KEYS.PRIVATE_C2C_PRICE;
        break;
    }

    if (typeof token === 'undefined') token = SettingService.getValueByKey(key) || 0;
    if (!token) return null; // do nothing if token is 0
    if (user.balance < token) throw new NotEnoughMoneyException();

    const paymentTransaction = new this.PurchasedItemModel();
    paymentTransaction.originalPrice = token;
    paymentTransaction.totalPrice = token;
    paymentTransaction.source = ROLE.USER;
    paymentTransaction.sourceId = user._id;
    paymentTransaction.target = type;
    paymentTransaction.sellerId = performerId;
    paymentTransaction.targetId = conversation._id;
    paymentTransaction.type = type;
    paymentTransaction.name = type;
    paymentTransaction.status = PURCHASE_ITEM_STATUS.SUCCESS;
    await paymentTransaction.save();
    const dto = PurchasedItemDto.fromModel(paymentTransaction);
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: dto
      })
    );
    return dto;
  }

  async sendTokenContribute(user: UserDto, performerId: string, payload: SendContributePayload) {
    if (user.balance < payload.token) {
      throw new BadRequestException('The selected contribution amount is more than your account token balance');
    }

    const crowdfunding = await this.CrowdfundingModel.findOne({ _id: payload.crowdfundfingId });

    if (!crowdfunding) {
      throw new EntityNotFoundException();
    }

    const paymentTransaction = new this.PurchasedItemModel();
    paymentTransaction.originalPrice = payload.token;
    paymentTransaction.totalPrice = payload.token;
    paymentTransaction.source = ROLE.USER;
    paymentTransaction.sourceId = user._id;
    paymentTransaction.target = PURCHASE_ITEM_TARGET_TYPE.CONTRIBUTE;
    paymentTransaction.sellerId = crowdfunding.performerId;
    paymentTransaction.targetId = crowdfunding._id;
    paymentTransaction.type = PURCHASE_ITEM_TYPE.CONTRIBUTE;
    paymentTransaction.name = 'contribute';
    paymentTransaction.status = PURCHASE_ITEM_STATUS.SUCCESS;
    await paymentTransaction.save();
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: paymentTransaction
      })
    );

    await this.CrowdfundingModel.updateOne(
      { _id: crowdfunding._id },
      {
        $inc: { remainingToken: payload.token },
        $push: { contributes: user._id }
      }
    );

    return paymentTransaction;
  }

  public async payForFeaturedCreator(data) {
    const performer = await this.performerService.findById(data.performerId);
    if (!performer || (performer && performer.balance < data.price)) {
      return {
        success: false
      };
    }

    const transaction = new this.PurchasedItemModel({
      source: 'performer',
      sourceId: data.performerId,
      target: PURCHASE_ITEM_TARGET_TYPE.FEATURED_CREATOR,
      targetId: data.packageId,
      // sellerId: video.performerId,
      type: PURCHASE_ITEM_TYPE.FEATURED_CREATOR,
      totalPrice: data.price,
      originalPrice: data.price,
      // name: video.title,
      description: 'Purchase feature creator',
      quantity: 1,
      payBy: 'token',
      status: PURCHASE_ITEM_STATUS.SUCCESS
    });

    await transaction.save();
    await this.performerService.increaseBalance(data.performerId, data.price * -1);
    // await this.queueEventService.publish(
    //   new QueueEvent({
    //     channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
    //     eventName: EVENT.CREATED,
    //     data: transaction
    //   })
    // );
    return {
      success: true
    };
  }

  async receiveReferralModel(userId: string, performerId: string, reward: number) {
    const paymentTransaction = new this.PurchasedItemModel();
    paymentTransaction.originalPrice = reward;
    paymentTransaction.totalPrice = reward;
    paymentTransaction.source = ROLE.PERFORMER;
    paymentTransaction.sourceId = userId;
    paymentTransaction.target = 'referral';
    paymentTransaction.sellerId = userId;
    paymentTransaction.targetId = performerId.toString();
    paymentTransaction.type = 'referral';
    paymentTransaction.name = 'referral';
    paymentTransaction.status = PURCHASE_ITEM_STATUS.SUCCESS;
    await paymentTransaction.save();
    const dto = PurchasedItemDto.fromModel(paymentTransaction);
    return dto;
  }

  public async peekIn(user: UserDto, id: string) {
    const stream = await this.streamPeekInService.getDetails(id, user._id);

    if (user.balance < stream.token) {
      throw new NotEnoughMoneyException();
    }

    const paymentTransaction = new this.PurchasedItemModel();
    paymentTransaction.originalPrice = stream.token;
    paymentTransaction.totalPrice = stream.token;
    paymentTransaction.source = ROLE.USER;
    paymentTransaction.sourceId = user._id;
    paymentTransaction.target = PURCHASE_ITEM_TARGET_TYPE.PRIVATE;
    paymentTransaction.sellerId = stream.performerId;
    paymentTransaction.targetId = stream._id;
    paymentTransaction.type = PURCHASE_ITEM_TYPE.PEEK_IN;
    paymentTransaction.name = PURCHASE_ITEM_TYPE.PEEK_IN;
    paymentTransaction.status = PURCHASE_ITEM_STATUS.SUCCESS;
    await paymentTransaction.save();
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: paymentTransaction
      })
    );

    return paymentTransaction;
  }
}
