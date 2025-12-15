import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  QueueEventService,
  QueueEvent,
  EntityNotFoundException
} from 'src/kernel';
import { FileDto } from 'src/modules/file';
import { UserDto } from 'src/modules/user/dtos';
import {
  DELETE_FILE_TYPE,
  FileService,
  FILE_EVENT,
  MEDIA_FILE_CHANNEL
} from 'src/modules/file/services';
import { merge } from 'lodash';
import { PerformerService, WatermarkSettingService } from 'src/modules/performer/services';
import { EVENT } from 'src/kernel/constants';
import { PaymentTokenService } from 'src/modules/purchased-item/services';
import { AuthService } from 'src/modules/auth/services';
import { Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { DBLoggerService } from 'src/modules/logger';
import { PHOTO_STATUS, PERFORMER_PHOTO_CHANNEL } from '../constants';
import { PhotoDto } from '../dtos';
import { PhotoCreatePayload, PhotoUpdatePayload } from '../payloads';
import { GalleryService } from './gallery.service';
import { Photo } from '../schemas';

const FILE_PROCESSED_TOPIC = 'FILE_PROCESSED';
const UPDATE_DEFAULT_COVER_GALLERY = 'UPDATE_DEFAULT_COVER_GALLERY';
@Injectable()
export class PhotoService {
  constructor(
    @InjectModel(Photo.name) private readonly PhotoModel: Model<Photo>,
    private readonly queueEventService: QueueEventService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(forwardRef(() => PaymentTokenService))
    private readonly paymentTokenService: PaymentTokenService,
    @Inject(forwardRef(() => GalleryService))
    private readonly galleryService: GalleryService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    private readonly logger: DBLoggerService,
    @Inject(forwardRef(() => WatermarkSettingService))
    private readonly watermarkService: WatermarkSettingService
  ) {
    this.queueEventService.subscribe(
      PERFORMER_PHOTO_CHANNEL,
      FILE_PROCESSED_TOPIC,
      this.handleFileProcessed.bind(this)
    );

    this.queueEventService.subscribe(
      PERFORMER_PHOTO_CHANNEL,
      UPDATE_DEFAULT_COVER_GALLERY,
      this.handleDefaultCoverGallery.bind(this)
    );
  }

  public async find(condition: FilterQuery<Photo> = {}): Promise<PhotoDto[]> {
    const items = await this.PhotoModel.find(condition);
    return items.map((item) => plainToInstance(PhotoDto, item.toObject()));
  }

  public async handleFileProcessed(event: QueueEvent) {
    try {
      if (event.eventName !== FILE_EVENT.PHOTO_PROCESSED) return;

      const { photoId } = event.data.meta;
      const [photo, file] = await Promise.all([
        this.PhotoModel.findById(photoId),
        this.fileService.findById(event.data.fileId)
      ]);
      if (!photo) {
        // TODO - delete file?
        return;
      }
      photo.processing = false;
      if (file.status === 'error') {
        photo.status = PHOTO_STATUS.FILE_ERROR;
      }
      await photo.save();
    } catch (e) {
      this.logger.error(e.stack || e, { context: 'PhotoService' });
    }
  }

  public async create(
    file: FileDto,
    payload: PhotoCreatePayload,
    creator?: UserDto
  ): Promise<PhotoDto> {
    if (!file) throw new Error('File is valid!');
    if (!file.isImage()) {
      await this.fileService.removeIfNotHaveRef(file._id);
      throw new Error('Invalid image!');
    }

    // process to create thumbnails
    const photo = new this.PhotoModel(payload);
    if (!photo.title) photo.title = file.name;

    photo.fileId = file._id;
    if (creator) {
      photo.createdBy = creator._id;
      photo.updatedBy = creator._id;
    }
    photo.processing = true;
    await photo.save();

    const watermark = await this.watermarkService.getWatermarkOptions(photo.performerId);

    await Promise.all([
      this.fileService.addRef(file._id, {
        itemType: 'performer-photo',
        itemId: photo._id
      }),
      this.fileService.queueProcessPhoto(file._id, {
        meta: {
          photoId: photo._id
        },
        publishChannel: PERFORMER_PHOTO_CHANNEL,
        thumbnailSize: {
          width: 250,
          height: 250
        },
        watermark
      })
    ]);

    const dto = plainToInstance(PhotoDto, photo);

    await this.queueEventService.publish(
      new QueueEvent({
        channel: PERFORMER_PHOTO_CHANNEL,
        eventName: EVENT.CREATED,
        data: dto
      })
    );

    return dto;
  }

  public async updateInfo(
    id: string | ObjectId,
    payload: PhotoUpdatePayload,
    file: FileDto,
    updater?: UserDto
  ): Promise<PhotoDto> {
    const photo = await this.PhotoModel.findById(id);
    if (!photo) {
      throw new EntityNotFoundException();
    }

    const oldStatus = photo.status;
    const oldGallery = photo.galleryId;
    const currentFile = photo.fileId;

    if (file) {
      if (!file.isImage) {
        await this.fileService.removeIfNotHaveRef(file._id);
        throw new Error('Invalid image!');
      }

      photo.fileId = file._id;
    }

    merge(photo, payload);
    if (
      photo.status !== PHOTO_STATUS.FILE_ERROR
      && payload.status !== PHOTO_STATUS.FILE_ERROR
    ) {
      photo.status = payload.status;
    }

    updater && photo.set('updatedBy', updater._id);
    photo.updatedAt = new Date();
    await photo.save();
    if (file && file.isImage()) {
      const watermark = await this.watermarkService.getWatermarkOptions(photo.performerId);
      await Promise.all([
        this.fileService.addRef(file._id, {
          itemType: 'performer-photo',
          itemId: photo._id
        }),
        this.fileService.queueProcessPhoto(file._id, {
          meta: {
            photoId: photo._id
          },
          publishChannel: PERFORMER_PHOTO_CHANNEL,
          thumbnailSize: {
            width: 250,
            height: 250
          },
          watermark
        }),
        this.queueEventService.publish(
          new QueueEvent({
            channel: MEDIA_FILE_CHANNEL,
            eventName: FILE_EVENT.FILE_RELATED_MODULE_UPDATED,
            data: {
              type: DELETE_FILE_TYPE.FILEID,
              currentFile,
              newFile: file._id
            }
          })
        )
      ]);
    }
    const dto = new PhotoDto(photo);
    this.queueEventService.publish(
      new QueueEvent({
        channel: PERFORMER_PHOTO_CHANNEL,
        eventName: EVENT.UPDATED,
        data: {
          ...dto,
          oldStatus,
          oldGallery
        }
      })
    );

    return dto;
  }

  public async details(id: string | ObjectId, jwToken: string): Promise<PhotoDto> {
    const photo = await this.PhotoModel.findOne({ _id: id });
    if (!photo) {
      throw new EntityNotFoundException();
    }

    const dto = new PhotoDto(photo);
    const [performer, gallery, file] = await Promise.all([
      photo.performerId
        ? this.performerService.findById(photo.performerId)
        : null,
      photo.galleryId ? this.galleryService.findById(photo.galleryId) : null,
      photo.fileId ? this.fileService.findById(photo.fileId) : null
    ]);

    dto.setPerformer(performer);
    dto.setPhoto(file, { jwt: jwToken });
    dto.setGallery(gallery);

    return dto;
  }

  public async delete(id: string | ObjectId) {
    const photo = await this.PhotoModel.findById(id);
    if (!photo) {
      throw new EntityNotFoundException();
    }

    const dto = new PhotoDto(photo);

    await photo.deleteOne();
    // TODO - should check ref and remove
    photo.fileId && await this.fileService.remove(photo.fileId);
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PERFORMER_PHOTO_CHANNEL,
        eventName: EVENT.DELETED,
        data: dto
      })
    );
    return true;
  }

  public async deleteMany(condition: FilterQuery<Photo>): Promise<void> {
    await this.PhotoModel.deleteMany(condition);
  }

  public async deleteManyByIds(ids: string[] | ObjectId[]): Promise<void> {
    await this.PhotoModel.deleteMany({ _id: { $in: ids } });
  }

  private async handleDefaultCoverGallery(event: QueueEvent) {
    if (![EVENT.CREATED, EVENT.UPDATED].includes(event.eventName)) {
      return;
    }
    const photo = event.data as PhotoDto;
    if (!photo.galleryId) return;

    const defaultCover = await this.PhotoModel.findOne({
      galleryId: photo.galleryId,
      status: PHOTO_STATUS.ACTIVE
    });
    await this.galleryService.updateCover(
      photo.galleryId,
      defaultCover ? defaultCover._id : null
    );

    // update cover field in the photo list
    const photoCover = await this.PhotoModel.findOne({
      galleryId: photo.galleryId,
      isGalleryCover: true
    });
    if (
      !defaultCover
      || (photoCover && photoCover._id.toString() === defaultCover.toString())
    ) return;
    await this.PhotoModel.updateOne(
      { _id: defaultCover._id },
      {
        isGalleryCover: true
      }
    );
  }

  /**
   * TODO - move to file service
   * @param req
   * @returns
   */
  public async checkAuth(req: Request) {
    const {
      query: { galleryId, token }
    } = req;
    const gallery = galleryId && (await this.galleryService.findById(galleryId as string));
    if (!gallery) {
      return false;
    }

    if (!gallery.isSale) {
      return true;
    }

    if (!token) {
      return false;
    }

    const user = await this.authService.getSourceFromJWT(token as string);
    if (!user) {
      return false;
    }

    if (user.roles && user.roles.includes('admin')) {
      return true;
    }

    if (user._id.toString() === gallery.performerId.toString()) {
      return true;
    }

    const checkBought = await this.paymentTokenService.checkBought(
      gallery._id,
      user
    );
    if (checkBought) {
      return true;
    }

    return false;
  }

  public async countTotalPhotos(query: FilterQuery<Photo> = {}): Promise<number> {
    return this.PhotoModel.countDocuments(query);
  }
}
