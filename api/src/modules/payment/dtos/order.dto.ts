import { ObjectId } from 'mongodb';
import { UserDto } from 'src/modules/user/dtos';
import { PerformerDto } from 'src/modules/performer/dtos';
import { Expose, Transform } from 'class-transformer';

export class OrderDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  orderNumber: string;

  @Expose()
  @Transform(({ obj }) => obj.buyerId)
  buyerId: ObjectId;

  @Expose()
  buyerSource: string;

  @Expose()
  @Transform(({ obj }) => obj.buyerInfo)
  buyerInfo: Partial<UserDto>;

  @Expose()
  @Transform(({ obj }) => obj.sellerId)
  sellerId: ObjectId;

  @Expose()
  sellerSource: string;

  @Expose()
  sellerUsername: string;

  @Expose()
  @Transform(({ obj }) => obj.sellerInfo)
  sellerInfo: Partial<UserDto | PerformerDto>;

  @Expose()
  type: string;

  // physical , digital...
  @Expose()
  productType: string;

  @Expose()
  @Transform(({ obj }) => obj.productId)
  productId: ObjectId;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  unitPrice: number;

  @Expose()
  quantity: number;

  @Expose()
  originalPrice: number;

  @Expose()
  totalPrice: number;

  @Expose()
  status: string;

  @Expose()
  deliveryStatus: string;

  @Expose()
  deliveryAddress: string;

  @Expose()
  postalCode: string;

  @Expose()
  paymentStatus: string;

  @Expose()
  payBy: string;

  @Expose()
  @Transform(({ obj }) => obj.couponInfo)
  couponInfo: Record<string, any>;

  @Expose()
  shippingCode: string;

  @Expose()
  @Transform(({ obj }) => obj.extraInfo)
  extraInfo: Record<string, any>;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  public setBuyerInfo(buyer: UserDto) {
    if (!buyer) return;

    const dto = new UserDto(buyer).toResponse(true);
    this.buyerInfo = {
      _id: buyer._id,
      username: buyer.username,
      badgingColor: dto.badgingColor
    };
  }

  public setSellerInfo(seller: UserDto | PerformerDto) {
    if (!seller) return;

    this.sellerInfo = seller.toSearchResponse();
  }
}
