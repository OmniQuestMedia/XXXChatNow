import { ObjectId } from 'mongodb';
import { Expose, Transform, plainToInstance } from 'class-transformer';
import { UserDto } from 'src/modules/user/dtos';
import { PerformerDto } from 'src/modules/performer/dtos';
import { StudioDto } from 'src/modules/studio/dtos';

export class PaymentInformationDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  orderNumber: string;

  @Expose()
  @Transform(({ obj }) => obj.sourceId)
  sourceId: ObjectId;

  @Expose()
  sourceType: string;

  @Expose()
  type: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  sourceInfo: Partial<UserDto | PerformerDto | StudioDto>;

  constructor(data: any) {
    Object.assign(this, data);
  }

  public static fromModel(model) {
    if (!model) return null;
    return plainToInstance(PaymentInformationDto, model.toObject(), {
      excludeExtraneousValues: false
    });
  }

  public setSourceInfo(source: UserDto | PerformerDto | StudioDto) {
    if (!source) return;
    this.sourceInfo = source.toResponse();
  }
}
