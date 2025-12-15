import { ObjectId } from 'mongodb';
import { Expose, Transform, plainToInstance } from 'class-transformer';
import { UserDto } from 'src/modules/user/dtos';
import { PerformerDto } from 'src/modules/performer/dtos';

export class PurchasedItemDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.sourceInfo)
  sourceInfo: any;

  @Expose()
  source: string;

  @Expose()
  @Transform(({ obj }) => obj.sourceId)
  sourceId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.sellerId)
  sellerId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.sellerInfo)
  sellerInfo: Partial<UserDto | PerformerDto>;

  @Expose()
  target: string;

  @Expose()
  @Transform(({ obj }) => obj.targetId)
  targetId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.targetInfo)
  targetInfo: any;

  @Expose()
  type: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  totalPrice: number;

  @Expose()
  originalPrice: number;

  @Expose()
  quantity: number;

  @Expose()
  status: string;

  @Expose()
  @Transform(({ obj }) => obj.extraInfo)
  extraInfo: Record<string, any>;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  public static fromModel(model) {
    if (!model) return null;
    return plainToInstance(PurchasedItemDto, model.toObject());
  }

  public setSellerInfo(seller: UserDto | PerformerDto) {
    if (!seller) return;
    this.sellerInfo = seller.toSearchResponse();
  }

  public setSourceInfo(source: UserDto | PerformerDto) {
    if (!source) return;
    this.sourceInfo = source.toSearchResponse();
  }

  public setTargetInfo(target: any) {
    this.targetInfo = target;
  }
}
