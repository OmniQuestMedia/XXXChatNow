import { ObjectId } from 'mongodb';
import { Expose, Transform } from 'class-transformer';

export class AggregatorCategoryDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  name: string;

  @Expose()
  alias: string;

  @Expose()
  active: boolean;

  @Expose()
  tags: string[];

  @Expose()
  metaTitle: string;

  @Expose()
  metaKeywords: string;

  @Expose()
  metaDescription: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  public toPublicSearchResponse(): Partial<AggregatorCategoryDto> {
    return {
      _id: this._id,
      name: this.name,
      alias: this.alias
    };
  }

  public toPublicDetailsResponse(): Partial<AggregatorCategoryDto> {
    return {
      _id: this._id,
      name: this.name,
      alias: this.alias,
      metaTitle: this.metaTitle,
      metaKeywords: this.metaKeywords,
      metaDescription: this.metaDescription
    };
  }
}
