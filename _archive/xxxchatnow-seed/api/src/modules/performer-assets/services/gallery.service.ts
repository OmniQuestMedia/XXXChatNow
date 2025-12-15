import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import {
  EntityNotFoundException, PageableData, QueueEvent, QueueEventService
} from 'src/kernel';
import { PerformerService } from 'src/modules/performer/services';
import { UserDto } from 'src/modules/user/dtos';
import { ObjectId } from 'mongodb';
import { merge } from 'lodash';
import { FileService } from 'src/modules/file/services';
import {
  PaymentTokenService
} from 'src/modules/purchased-item/services';
import {
  PURCHASE_ITEM_STATUS
} from 'src/modules/purchased-item/constants';
import { EVENT } from 'src/kernel/constants';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { GalleryUpdatePayload } from '../payloads/gallery-update.payload';
import { GalleryDto } from '../dtos';
import { GalleryCreatePayload, GallerySearchRequest } from '../payloads';
import { PERFORMER_GALLERY_CHANNEL } from '../constants';
import { Gallery, Photo } from '../schemas';

@Injectable()
export class GalleryService {
  constructor(
    @InjectModel(Photo.name) private readonly PhotoModel: Model<Photo>,
    @InjectModel(Gallery.name) private readonly GalleryModel: Model<Gallery>,

    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => PaymentTokenService))
    private readonly paymentTokenService: PaymentTokenService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    private readonly queueEventServce: QueueEventService
  ) { }

  public async create(
    payload: GalleryCreatePayload,
    creator?: UserDto
  ): Promise<GalleryDto> {
    if (payload.performerId) {
      const performer = await this.performerService.findById(
        payload.performerId
      );
      if (!performer) {
        throw new EntityNotFoundException('Performer not found!');
      }
    }

    const model = new this.GalleryModel(payload);
    if (creator) {
      if (!model.performerId) {
        model.performerId = creator._id;
      }
      model.createdBy = creator._id;
      model.updatedBy = creator._id;
    }

    await model.save();
    return plainToInstance(GalleryDto, model.toObject());
  }

  public async update(
    id: string | ObjectId,
    payload: GalleryUpdatePayload,
    creator?: UserDto
  ): Promise<GalleryDto> {
    const gallery = await this.GalleryModel.findById(id);
    if (!gallery) {
      throw new EntityNotFoundException('Gallery not found!');
    }

    merge(gallery, payload);
    gallery.updatedAt = new Date();
    if (creator) {
      gallery.updatedBy = creator._id;
    }

    await gallery.save();
    return plainToInstance(GalleryDto, gallery.toObject());
  }

  public async findByIds(ids: string[] | ObjectId[]): Promise<GalleryDto[]> {
    const galleries = await this.GalleryModel
      .find({
        _id: {
          $in: ids
        }
      })
      .lean()
      .exec();

    return galleries.map((g) => new GalleryDto(g));
  }

  public async findById(id: string | ObjectId): Promise<GalleryDto> {
    const gallery = await this.GalleryModel.findOne({ _id: id });
    if (!gallery) {
      throw new EntityNotFoundException();
    }
    return new GalleryDto(gallery);
  }

  public async details(id: string | ObjectId, user: UserDto): Promise<GalleryDto> {
    const gallery = await this.GalleryModel.findOne({ _id: id });
    if (!gallery) {
      throw new EntityNotFoundException();
    }

    const dto = new GalleryDto(gallery);
    if (gallery.performerId) {
      const performer = await this.performerService.findById(
        gallery.performerId
      );
      dto.setPerformer(performer);
    }

    const isBought = user
      ? await this.paymentTokenService.checkBought(
        gallery._id,
        user
      )
      : false;
    dto.setIsBought(isBought);

    return dto;
  }

  public async adminSearch(
    req: GallerySearchRequest,
    jwToken: string
  ): Promise<PageableData<GalleryDto>> {
    const query = {} as any;
    if (req.q) query.name = { $regex: req.q };
    if (req.performerId) query.performerId = req.performerId;
    if (req.status) query.status = req.status;
    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.GalleryModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.GalleryModel.countDocuments(query)
    ]);

    const performerIds = data.map((d) => d.performerId);
    const coverPhotoIds = data.map((d) => d.coverPhotoId);

    const [performers, coverPhotos] = await Promise.all([
      performerIds.length ? this.performerService.findByIds(performerIds) : [],
      coverPhotoIds.length
        ? this.PhotoModel
          .find({ _id: { $in: coverPhotoIds } })
          .lean()
          .exec()
        : []
    ]);
    const fileIds = coverPhotos.map((c) => c.fileId);
    const files = await this.fileService.findByIds(fileIds);

    const galleries = data.map((g) => {
      // TODO - should get picture (thumbnail if have?)
      const performer = g.performerId
        && performers.find((p) => p._id.toString() === g.performerId.toString());

      const coverPhoto = g.coverPhotoId
        && coverPhotos.find((c) => c._id.toString() === g.coverPhotoId.toString());
      const file = coverPhoto
        && files.find((f) => f._id.toString() === coverPhoto.fileId.toString());

      const dto = plainToInstance(GalleryDto, g);
      dto.setPerformer(performer);
      dto.setCoverPhoto(file, { jwt: jwToken });

      return dto;
    });

    return {
      data: galleries,
      total
    };
  }

  public async performerSearch(
    req: GallerySearchRequest,
    user: UserDto,
    jwToken: string
  ): Promise<PageableData<GalleryDto>> {
    const query = {} as any;
    if (req.q) query.name = { $regex: req.q };
    query.performerId = user._id;
    if (req.status) query.status = req.status;
    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.GalleryModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.GalleryModel.countDocuments(query)
    ]);

    const performerIds = data.map((d) => d.performerId);
    const coverPhotoIds = data.map((d) => d.coverPhotoId);

    const [performers, coverPhotos] = await Promise.all([
      performerIds.length ? this.performerService.findByIds(performerIds) : [],
      coverPhotoIds.length
        ? this.PhotoModel
          .find({ _id: { $in: coverPhotoIds } })
          .lean()
          .exec()
        : []
    ]);
    const fileIds = coverPhotos.map((c) => c.fileId);
    const files = await this.fileService.findByIds(fileIds);

    const galleries = data.map((g) => {
      const performer = g.performerId
        && performers.find((p) => p._id.toString() === g.performerId.toString());

      const coverPhoto = g.coverPhotoId
        && coverPhotos.find((c) => c._id.toString() === g.coverPhotoId.toString());
      const file = coverPhoto
        && files.find((f) => f._id.toString() === coverPhoto.fileId.toString());

      const dto = plainToInstance(GalleryDto, g);
      dto.setPerformer(performer);
      dto.setCoverPhoto(file, { jwt: jwToken });

      return dto;
    });

    return {
      data: galleries,
      total
    };
  }

  public async userSearch(
    req: GallerySearchRequest,
    user: UserDto,
    jwToken: string
  ): Promise<PageableData<GalleryDto>> {
    const query = {} as any;
    if (req.q) query.name = { $regex: req.q };
    if (req.performerId) query.performerId = req.performerId;
    query.status = 'active';
    query.numOfItems = { $gt: 0 };
    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.GalleryModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.GalleryModel.countDocuments(query)
    ]);

    const performerIds = data.map((d) => d.performerId);
    const coverPhotoIds = data.map((d) => d.coverPhotoId);
    const galleryIds = data.map((d) => d._id);
    const [performers, coverPhotos, payments] = await Promise.all([
      performerIds.length ? this.performerService.findByIds(performerIds) : [],
      coverPhotoIds.length
        ? this.PhotoModel
          .find({ _id: { $in: coverPhotoIds } })
          .lean()
          .exec()
        : [],
      user ? this.paymentTokenService.findByQuery({
        sourceId: user._id,
        targetId: { $in: galleryIds },
        status: PURCHASE_ITEM_STATUS.SUCCESS
      }) : []
    ]);
    const fileIds = coverPhotos.map((c) => c.fileId);
    const files = await this.fileService.findByIds(fileIds);

    const galleries = data.map((g) => {
      // TODO - should get picture (thumbnail if have?)
      const purchased = user && payments.find((p) => p.targetId.toString() === g._id.toString());
      const performer = g.performerId
        && performers.find((p) => p._id.toString() === g.performerId.toString());

      const coverPhoto = g.coverPhotoId
        && coverPhotos.find((c) => c._id.toString() === g.coverPhotoId.toString());
      const file = coverPhoto
        && files.find((f) => f._id.toString() === coverPhoto.fileId.toString());

      const dto = plainToInstance(GalleryDto, g);
      dto.setPerformer(performer);
      dto.setCoverPhoto(file, { jwt: jwToken });
      dto.setIsBought(!!purchased);

      return dto;
    });

    return {
      data: galleries,
      total
    };
  }

  public async updateCover(
    galleryId: string | ObjectId,
    photoId: string | ObjectId
  ): Promise<boolean> {
    await this.GalleryModel.updateOne(
      { _id: galleryId },
      {
        coverPhotoId: new ObjectId(photoId)
      }
    );
    return true;
  }

  public async delete(galleryId: string | ObjectId) {
    const gallery = await this.GalleryModel.findById(galleryId);
    if (!gallery) {
      throw new EntityNotFoundException();
    }
    await gallery.deleteOne();
    this.queueEventServce.publish(new QueueEvent({
      channel: PERFORMER_GALLERY_CHANNEL,
      eventName: EVENT.DELETED,
      data: { galleryId }
    }));
    return true;
  }

  public async countTotalGalleries(query: FilterQuery<Gallery> = {}): Promise<number> {
    return this.GalleryModel.countDocuments(query);
  }
}
