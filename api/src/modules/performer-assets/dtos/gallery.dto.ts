import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { Expose, Transform } from 'class-transformer';
import { PerformerDto } from 'src/modules/performer/dtos';

interface ISetFileOptions {
  /**
   * option to show main file URL or not
   */
  includeFileUrl?: boolean;

  /**
   * custom jwt for the video file
   */
  jwt?: string;
}

export class GalleryDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.performerId)
  performerId: ObjectId;

  @Expose()
  type: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  status: string;

  @Expose()
  processing: boolean;

  @Expose()
  @Transform(({ obj }) => obj.coverPhotoId)
  coverPhotoId: ObjectId;

  @Expose()
  token: number;

  @Expose()
  coverPhoto: Record<string, any>;

  @Expose()
  isBought: boolean;

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

  @Expose()
  isSale: boolean;

  @Expose()
  numOfItems: number;

  constructor(init: Partial<GalleryDto>) {
    Object.assign(
      this,
      pick(init, [
        '_id',
        'performerId',
        'numOfItems',
        'type',
        'name',
        'description',
        'status',
        'coverPhotoId',
        'token',
        'isBought',
        'coverPhoto',
        'performer',
        'createdBy',
        'updatedBy',
        'createdAt',
        'updatedAt',
        'isSale'
      ])
    );
  }

  public toPublic(): Partial<GalleryDto> {
    return pick(this, [
      '_id',
      'performerId',
      'numOfItems',
      'type',
      'name',
      'description',
      'status',
      'coverPhotoId',
      'token',
      'isBought',
      'coverPhoto',
      'performer',
      'createdAt',
      'isSale'
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

  public setIsBought(isBought: boolean) {
    this.isBought = isBought;
  }

  public setCoverPhoto(file, options: ISetFileOptions = {}) {
    const { jwt = '' } = options;
    this.coverPhoto = file && {
      url: jwt ? `${file.getUrl()}?galleryId=${this._id}&token=${jwt}` : `${file.getUrl()}?galleryId=${this._id}`,
      thumbnails: file.getThumbnails()
    };
  }
}
