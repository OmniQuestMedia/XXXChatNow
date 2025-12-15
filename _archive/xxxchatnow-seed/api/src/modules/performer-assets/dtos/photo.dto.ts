import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { Expose, Transform } from 'class-transformer';
import { PerformerDto } from 'src/modules/performer/dtos';
import { FileDto } from 'src/modules/file';
import { GalleryDto } from './gallery.dto';

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

export class PhotoDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.performerId)
  performerId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.galleryId)
  galleryId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.fileId)
  fileId: ObjectId;

  @Expose()
  photo: any;

  @Expose()
  type: string;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  status: string;

  @Expose()
  processing: boolean;

  @Expose()
  performer: Partial<PerformerDto>;

  @Expose()
  gallery: Partial<GalleryDto> | Record<string, any>;

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

  constructor(init: Partial<PhotoDto>) {
    Object.assign(
      this,
      pick(init, [
        '_id',
        'performerId',
        'galleryId',
        'fileId',
        'photo',
        'type',
        'title',
        'description',
        'status',
        'processing',
        'performer',
        'createdBy',
        'updatedBy',
        'createdAt',
        'updatedAt'
      ])
    );
  }

  toPublic(): Partial<PhotoDto> {
    return pick(this, [
      '_id',
      'performerId',
      'galleryId',
      'photo',
      'type',
      'title',
      'description',
      'status',
      'processing',
      'performer',
      'createdAt'
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

  public setPhoto(file: FileDto, options: ISetFileOptions = {}) {
    if (!file) return;

    const {
      jwt = ''
    } = options;

    this.photo = {
      url: `${file.getUrl()}?galleryId=${this.galleryId}&token=${jwt || ''}`,
      thumbnails: file.getThumbnails(),
      width: file.width,
      height: file.height,
      mimeType: file.mimeType
    };
  }

  public setGallery(gallery: GalleryDto | Partial<GalleryDto | any>) {
    if (!gallery) return;
    if (gallery instanceof GalleryDto) {
      this.gallery = gallery.toPublic();
    } else {
      const dto = new GalleryDto(gallery);
      this.gallery = dto.toPublic();
    }
  }
}
