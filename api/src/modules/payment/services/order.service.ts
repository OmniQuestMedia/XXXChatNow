import {
  Injectable,
  Inject,
  forwardRef
} from '@nestjs/common';
import { UserDto } from 'src/modules/user/dtos';
import {
  EntityNotFoundException, QueueEvent, QueueEventService
} from 'src/kernel';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { TokenPackageService } from 'src/modules/token-package/services';
import { PerformerService } from 'src/modules/performer/services';
import { UserService } from 'src/modules/user/services';
import { EVENT } from 'src/kernel/constants';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import {
  ORDER_STATUS, DELIVERY_STATUS, PRODUCT_TYPE, PAYMENT_STATUS, ORDER_UPDATE_CHANNEL
} from '../constants';
import { OrderDto } from '../dtos';
import { OrderUpdatePayload } from '../payloads/order-update.payload';
import { Order, OrderDocument } from '../schemas';

@Injectable()
export class OrderService {
  constructor(
    // @InjectModel(Order.name) private readonly OrderModel: Model<Order>,
    @InjectModel(Order.name) private readonly OrderModel: Model<OrderDocument>,
    @Inject(forwardRef(() => TokenPackageService))
    private readonly tokenService: TokenPackageService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly queueEventService: QueueEventService
  ) { }

  public async createTokenOrderFromPayload(packageId: string | ObjectId, user: UserDto, orderStatus = ORDER_STATUS.CREATED): Promise<OrderDto> {
    const packageToken = await this.tokenService.findById(packageId);
    if (!packageToken) throw new EntityNotFoundException();

    const orderNumber = `TP${new Date().getTime()}`;
    const order = new this.OrderModel({
      orderNumber,
      // buyer ID
      buyerId: user._id,
      buyerSource: 'user',
      sellerId: null,
      sellerSource: 'system',
      type: PRODUCT_TYPE.TOKEN,
      productType: PRODUCT_TYPE.TOKEN,
      productId: packageToken._id,
      name: packageToken.name,
      description: `${packageToken.price.toFixed(2)} for ${packageToken.tokens} tokens`,
      unitPrice: packageToken.price,
      quantity: 1,
      originalPrice: packageToken.price,
      totalPrice: packageToken.price,
      status: orderStatus,
      deliveryStatus: DELIVERY_STATUS.CREATED,
      deliveryAddress: '',
      paymentStatus: PAYMENT_STATUS.PENDING,
      payBy: 'money',
      couponInfo: null,
      shippingCode: null,
      extraInfo: null
    });

    await order.save();
    return plainToInstance(OrderDto, order.toObject());
  }

  public async findById(id): Promise<OrderDto> {
    const item = await this.OrderModel.findById(id);
    return item ? plainToInstance(OrderDto, item.toObject()) : null;
  }

  public async findByIds(ids): Promise<OrderDto[]> {
    const items = await this.OrderModel.find({ _id: { $in: ids } });
    return items.map((i) => plainToInstance(OrderDto, i.toObject()));
  }

  public async getDetails(id: string | ObjectId | OrderDto): Promise<OrderDto> {
    const order = id instanceof OrderDto ? id : await this.findById(id);
    if (!order) throw new EntityNotFoundException();

    // map info of seller, buyer and product info if have
    if (order.sellerSource === 'performer') {
      const performer = await this.performerService.findById(order.sellerId);
      order.setSellerInfo(performer);
    }
    const user = await this.userService.findById(order.buyerId);
    order.setBuyerInfo(user);

    return order;
  }

  public async update(id: string | ObjectId, payload: OrderUpdatePayload): Promise<OrderDto> {
    const order = await this.OrderModel.findById(id);
    if (!order) throw new EntityNotFoundException();

    const oldDeliveryStatus = order.deliveryStatus;
    if (payload.deliveryStatus) order.deliveryStatus = payload.deliveryStatus;
    if (payload.shippingCode) order.shippingCode = payload.shippingCode;
    await order.save();

    const dto = plainToInstance(OrderDto, order.toObject());
    await this.queueEventService.publish(
      new QueueEvent({
        channel: ORDER_UPDATE_CHANNEL,
        eventName: EVENT.UPDATED,
        data: {
          oldValue: {
            deliveryStatus: oldDeliveryStatus
          },
          newValue: dto
        }
      })
    );
    return dto;
  }

  public async countByDeliveryStatus(deliveryStatus: string): Promise<number> {
    return this.OrderModel.countDocuments({ deliveryStatus });
  }

  public async createOrderForSpinWheel(
    amount: number,
    userId: string | ObjectId,
    performerId: string | ObjectId,
    description: string,
    orderStatus = ORDER_STATUS.PAID
  ) {
    const orderNumber = `TP${new Date().getTime()}`;
    const order = await this.OrderModel.create({
      buyerId: userId,
      buyerSource: 'user',
      sellerId: performerId,
      name: 'wheel',
      sellerSource: 'performer',
      type: PRODUCT_TYPE.SPIN_WHEEL,
      productType: PRODUCT_TYPE.SPIN_WHEEL,
      orderNumber,
      postalCode: '',
      quantity: 1,
      originalPrice: amount,
      totalPrice: amount,
      couponInfo: null,
      status: orderStatus,
      deliveryAddress: DELIVERY_STATUS.DELIVERED,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      paymentStatus: PAYMENT_STATUS.PENDING
    });

    return order;
  }
}
