import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { Expose, Transform } from 'class-transformer';
import { UserDto } from 'src/modules/user/dtos';

export interface PaymentProduct {
  name: string;
  description: string;
  price: number | string;
  extraInfo: any;
  productType: string;
  productId: string | ObjectId;
  quantity: number;
}

export interface DigitalProductResponse {
  digitalFileUrl: any;
  digitalFileId: any;
  _id: string | ObjectId;
}

export class PaymentTransactionDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.orderId)
  orderId: ObjectId;

  @Expose()
  paymentGateway: string;

  @Expose()
  @Transform(({ obj }) => obj.buyerInfo)
  buyerInfo: Partial<UserDto>;

  @Expose()
  buyerSource: string;

  @Expose()
  @Transform(({ obj }) => obj.buyerId)
  buyerId: ObjectId;

  @Expose()
  sellerSource: string;

  @Expose()
  @Transform(({ obj }) => obj.sellerId)
  sellerId: ObjectId;

  @Expose()
  type: string;

  @Expose()
  @Transform(({ obj }) => obj.products)
  products: PaymentProduct[];

  @Expose()
  @Transform(({ obj }) => obj.paymentResponseInfo)
  paymentResponseInfo: Record<string, any>;

  @Expose()
  totalPrice: number;

  @Expose()
  status: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(data: Partial<PaymentTransactionDto>) {
    data
      && Object.assign(
        this,
        pick(data, [
          '_id',
          'paymentGateway',
          'buyerInfo',
          'buyerSource',
          'buyerId',
          'type',
          'products',
          'paymentResponseInfo',
          'status',
          'totalPrice',
          'originalPrice',
          'createdAt',
          'updatedAt'
        ])
      );
  }

  toResponse(includePrivateInfo = false): any {
    const publicInfo = {
      _id: this._id,
      paymentGateway: this.paymentGateway,
      buyerId: this.buyerId,
      buyerSource: this.buyerSource,
      buyerInfo: this.buyerInfo,
      sellerSource: this.sellerSource,
      sellerId: this.sellerId,
      type: this.type,
      products: this.products,
      totalPrice: this.totalPrice,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };

    const privateInfo = {
      paymentResponseInfo: this.paymentResponseInfo
    };
    if (!includePrivateInfo) {
      return publicInfo;
    }

    return {
      ...publicInfo,
      ...privateInfo
    };
  }

  public setBuyerInfo(buyer: UserDto) {
    if (!buyer) return;
    this.buyerInfo = buyer.toResponse();
  }
}
