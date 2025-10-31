import { ObjectId } from 'mongodb';
import { Expose, Transform, plainToInstance } from 'class-transformer';
import { PerformerDto } from 'src/modules/performer/dtos';

export class CrowdfundingDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  title: string;

  @Expose()
  descriptions: string;

  @Expose()
  token: number;

  @Expose()
  remainingToken: number;

  @Expose()
  @Transform(({ obj }) => obj.performerId)
  performerId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.performerInfo)
  performerInfo?: Partial<PerformerDto>;

  @Expose()
  @Transform(({ obj }) => obj.contributes)
  contributes: ObjectId[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  public static fromModel(model: any) {
    if (!model) return null;
    return plainToInstance(CrowdfundingDto, model.toObject ? model.toObject() : model);
  }

  public setPerformerInfo(performer: PerformerDto) {
    if (!performer) return;
    this.performerInfo = performer.toSearchResponse();
  }
}
