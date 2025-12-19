import { Expose, Transform, plainToInstance } from 'class-transformer';
import { pick } from 'lodash';
import { ObjectId } from 'mongodb';
import { OrderDto } from 'src/modules/payment/dtos';
import { ProductDto } from 'src/modules/performer-assets/dtos';
import { PerformerDto } from 'src/modules/performer/dtos';
import { UserDto } from 'src/modules/user/dtos';

export class RefundRequestDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.userId)
  userId: ObjectId;

  @Expose()
  sourceType: string;

  @Expose()
  @Transform(({ obj }) => obj.sourceId)
  sourceId: ObjectId;

  @Expose()
  token: number;

  @Expose()
  @Transform(({ obj }) => obj.performerId)
  performerId: ObjectId;

  @Expose()
  description: string;

  @Expose()
  status: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Transform(({ obj }) => obj.performerInfo)
  performerInfo: Partial<PerformerDto>;

  @Expose()
  @Transform(({ obj }) => obj.userInfo)
  userInfo: Partial<UserDto>;

  @Expose()
  @Transform(({ obj }) => obj.productInfo)
  productInfo: Partial<ProductDto>;

  @Expose()
  @Transform(({ obj }) => obj.orderInfo)
  orderInfo: Partial<OrderDto>;

  constructor(data: Partial<RefundRequestDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'userId',
        'sourceType',
        'sourceId',
        'token',
        'performerId',
        'description',
        'status',
        'createdAt',
        'updatedAt',
        'performerInfo',
        'userInfo',
        'productInfo',
        'orderInfo'
      ])
    );
  }

  public static fromModel(model) {
    if (!model) return null;
    return plainToInstance(RefundRequestDto, model.toObject());
  }

  public setUserInfo(user: UserDto) {
    if (!user) return;
    this.userInfo = user.toResponse();
  }

  public setPerformerInfo(performer: PerformerDto) {
    if (!performer) return;
    this.performerInfo = performer.toResponse();
  }

  public setProductInfo(product: ProductDto) {
    if (!product) return;
    this.productInfo = product.toPublic();
  }

  public setOrderInfo(order: OrderDto) {
    if (!order) return;
    this.orderInfo = order;
  }
}
