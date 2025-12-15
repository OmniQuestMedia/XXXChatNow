import { ObjectId } from 'mongodb';
import { Expose, Transform } from 'class-transformer';
import { FileDto } from 'src/modules/file';

export class BannerDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.fileId)
  fileId: ObjectId;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  contentHTML: string;

  @Expose()
  href: string;

  @Expose()
  type: string;

  @Expose()
  status: string;

  @Expose()
  position: string;

  @Expose()
  photo?: any;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  setPhoto(file: FileDto) {
    this.photo = {
      thumbnails: file.getThumbnails(),
      url: file.getUrl(),
      width: file.width,
      height: file.height,
      mimeType: file.mimeType
    };
  }
}
