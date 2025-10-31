import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { Expose, Transform } from 'class-transformer';
import { PerformerDto } from 'src/modules/performer/dtos';
import { FileDto } from 'src/modules/file';

export interface ISetInfoOptions {
  video?: FileDto;

  trailer?: FileDto;

  /**
   * custom file dto
   */
  thumbnail?: FileDto;

  performer?: PerformerDto | Partial<PerformerDto> | any;

  isBought?: boolean;

  /**
   * option to show main file URL or not
   */
  includeFileUrl?: boolean;

  /**
   * custom jwt for the video file
   */
  jwt?: string;
}

export interface ISetVideoOptions {
  /**
   * option to show main file URL or not
   */
  includeFileUrl?: boolean;

  /**
   * custom jwt for the video file
   */
  jwt?: string;
}

export class VideoDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.performerId)
  performerId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.fileId)
  fileId: ObjectId;

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
  @Transform(({ obj }) => obj.thumbnailId)
  thumbnailId: ObjectId;

  @Expose()
  token: number;

  @Expose()
  isBought: boolean;

  @Expose()
  thumbnail: string;

  @Expose()
  video: Record<string, any>;

  @Expose()
  trailer: Record<string, any>;

  @Expose()
  @Transform(({ obj }) => obj.trailerId)
  trailerId: ObjectId;

  @Expose()
  isSaleVideo: boolean;

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

  constructor(init: Partial<VideoDto>) {
    Object.assign(this, pick(init, [
      '_id',
      'performerId',
      'fileId',
      'type',
      'title',
      'description',
      'status',
      'processing',
      'thumbnailId',
      'token',
      'video',
      'thumbnail',
      'isSaleVideo',
      'trailer',
      'trailerId',
      'performer',
      'createdBy',
      'updatedBy',
      'createdAt',
      'updatedAt',
      'isBought'
    ]));
  }

  public setVideo(file: FileDto, options: ISetVideoOptions = {}) {
    const {
      includeFileUrl = false,
      jwt = ''
    } = options;

    const output: Record<string, any> = {
      duration: file.duration,
      thumbnails: file.getThumbnails(),
      mineType: file.mimeType,
      absolutePath: file.absolutePath
    };
    if (includeFileUrl) {
      output.url = `${file.getUrl()}?videoId=${this._id}&token=${jwt}`;
    }

    this.video = output;
  }

  public setTrailer(file: FileDto) {
    if (!file) return;

    this.trailer = {
      url: file.getUrl(),
      thumbnails: file.getThumbnails(),
      duration: file.duration
    };
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

  public setThumbnail(thumbnail: FileDto) {
    if (!thumbnail) return;
    this.thumbnail = thumbnail.getUrl();
  }

  public setIsBought(isBought: boolean) {
    this.isBought = isBought;
  }

  public setInfo({
    video,
    trailer,
    thumbnail,
    performer,
    isBought,
    includeFileUrl,
    jwt
  }: ISetInfoOptions) {
    if (video) this.setVideo(video, { includeFileUrl, jwt });
    if (trailer) this.setTrailer(trailer);
    if (thumbnail) this.setThumbnail(thumbnail);
    if (performer) this.setPerformer(performer);
    if (typeof isBought === 'boolean') this.setIsBought(isBought);
  }
}
