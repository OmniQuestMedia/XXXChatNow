import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { Expose, Transform } from 'class-transformer';
import { PerformerDto } from 'src/modules/performer/dtos';
import { FileDto } from 'src/modules/file';

export interface ISetFileOptions {
  /**
   * option to show main file URL or not
   */
  includeFileUrl?: boolean;

  /**
   * custom jwt for the video file
   */
  jwt?: string;
}

export class ProductDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.performerId)
  performerId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.digitalFileId)
  digitalFileId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.imageId)
  imageId: ObjectId;

  @Expose()
  image: string;

  @Expose()
  digitalFile: string;

  @Expose()
  type: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  publish: boolean;

  @Expose()
  isBought: boolean;

  @Expose()
  status: string;

  @Expose()
  token: number;

  @Expose()
  stock: number;

  @Expose()
  performer: Partial<PerformerDto>;

  @Expose()
  @Transform(({ obj }) => obj.createdBy)
  createdBy: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.updatedBy)
  updatedBy: ObjectId;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(init: Partial<ProductDto>) {
    Object.assign(
      this,
      pick(init, [
        '_id',
        'performerId',
        'digitalFileId',
        'imageId',
        'image',
        'digitalFile',
        'type',
        'name',
        'description',
        'publish',
        'isBought',
        'status',
        'token',
        'stock',
        'performer',
        'createdBy',
        'updatedBy',
        'createdAt',
        'updatedAt'
      ])
    );
  }

  toPublic() {
    return pick(this, [
      '_id',
      'performerId',
      'image',
      'type',
      'name',
      'description',
      'status',
      'token',
      'stock',
      'publish',
      'isBought',
      'performer',
      'createdAt',
      'updatedAt'
    ]);
  }

  public setPerformer(performer: PerformerDto | Partial<PerformerDto> | any) {
    if (!performer) return;
    if (performer instanceof PerformerDto) {
      this.performer = performer.toSearchResponse();
    } else {
      const dto = new PerformerDto(performer);
      this.performer = dto.toSearchResponse();
    }
  }

  public setImage(file: FileDto) {
    if (!file) return;
    this.image = file.getUrl();
  }

  public setDigitalFile(file: FileDto, options: ISetFileOptions = {}) {
    if (!file) return;

    const {
      jwt = ''
    } = options;

    this.digitalFile = `${file.getUrl()}?productId=${this._id}&token=${jwt || ''}`;
  }

  public setIsBought(isBought: boolean) {
    this.isBought = isBought;
  }
}
