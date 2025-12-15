import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import {
  PageableData,
  SearchRequest,
  EntityNotFoundException
} from 'src/kernel';
import { PerformerService } from 'src/modules/performer/services';
import { FileService } from 'src/modules/file/services';
import { PaymentTokenService } from 'src/modules/purchased-item/services';
import {
  PURCHASE_ITEM_STATUS,
  PURCHASE_ITEM_TARGET_TYPE
} from 'src/modules/purchased-item/constants';
import { UserDto } from 'src/modules/user/dtos';
import { ObjectId } from 'mongodb';
import { ItemNotPurchasedException } from 'src/modules/purchased-item/exceptions';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { GalleryService } from './gallery.service';
import { PhotoSearchRequest } from '../payloads';
import { PhotoDto } from '../dtos';
import { Photo } from '../schemas';

@Injectable()
export class PhotoSearchService {
  constructor(
    @InjectModel(Photo.name) private readonly PhotoModel: Model<Photo>,
    private readonly performerService: PerformerService,
    private readonly galleryService: GalleryService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @Inject(forwardRef(() => PaymentTokenService))
    private readonly paymentTokenService: PaymentTokenService
  ) { }

  public async adminSearch(req: PhotoSearchRequest, jwToken: string): Promise<PageableData<PhotoDto>> {
    const query = {} as any;
    if (req.q) query.title = { $regex: req.q };
    if (req.performerId) query.performerId = req.performerId;
    if (req.galleryId) query.galleryId = req.galleryId;
    if (req.status) query.status = req.status;
    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.PhotoModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.PhotoModel.countDocuments(query)
    ]);

    const performerIds = data.map((d) => d.performerId);
    const galleryIds = data.map((d) => d.galleryId);
    const fileIds = data.map((d) => d.fileId);
    const [performers, galleries, files] = await Promise.all([
      performerIds.length ? this.performerService.findByIds(performerIds) : [],
      galleryIds.length ? this.galleryService.findByIds(galleryIds) : [],
      fileIds.length ? this.fileService.findByIds(fileIds) : []
    ]);
    const photos = data.map((photo) => {
      // TODO - should get picture (thumbnail if have?)
      const performer = photo.performerId
        && performers.find((p) => p._id.toString() === photo.performerId.toString());

      const gallery = photo.galleryId
        && galleries.find((p) => p._id.toString() === photo.galleryId.toString());

      const file = photo.fileId
        && files.find((f) => f._id.toString() === photo.fileId.toString());

      const dto = plainToInstance(PhotoDto, photo);
      dto.setGallery(gallery);
      dto.setPerformer(performer);
      dto.setPhoto(file, { jwt: jwToken });

      return dto;
    });

    return {
      data: photos,
      total
    };
  }

  public async userSearch(
    galleryId: string | ObjectId,
    req: SearchRequest,
    user: UserDto,
    jwToken: string
  ): Promise<PageableData<Partial<PhotoDto>>> {
    const gallery = await this.galleryService.findById(galleryId);
    if (!gallery) {
      throw new EntityNotFoundException();
    }

    if (gallery.isSale) {
      const payment = await this.paymentTokenService.findByQuery({
        sourceId: user._id,
        targetId: galleryId,
        target: PURCHASE_ITEM_TARGET_TYPE.PHOTO,
        status: PURCHASE_ITEM_STATUS.SUCCESS
      });
      if (!payment) {
        throw new ItemNotPurchasedException();
      }
    }

    const query = {} as any;
    query.galleryId = galleryId;
    query.status = 'active';

    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }

    const [data, total] = await Promise.all([
      this.PhotoModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.PhotoModel.countDocuments(query)
    ]);

    const performerIds = data.map((d) => d.performerId);
    const galleryIds = data.map((d) => d.galleryId);
    const fileIds = data.map((d) => d.fileId);
    const [performers, galleries, files] = await Promise.all([
      performerIds.length ? this.performerService.findByIds(performerIds) : [],
      galleryIds.length ? this.galleryService.findByIds(galleryIds) : [],
      fileIds.length ? this.fileService.findByIds(fileIds) : []
    ]);
    const photos = data.map((photo) => {
      // TODO - should get picture (thumbnail if have?)
      const performer = photo.performerId
        && performers.find((p) => p._id.toString() === photo.performerId.toString());

      const photoGallery = photo.galleryId
        && galleries.find((p) => p._id.toString() === photo.galleryId.toString());

      const file = photo.fileId
        && files.find((f) => f._id.toString() === photo.fileId.toString());

      const dto = plainToInstance(PhotoDto, photo);
      dto.setGallery(photoGallery);
      dto.setPerformer(performer);
      dto.setPhoto(file, { jwt: jwToken });

      return dto;
    });

    return {
      data: photos.map((v) => v.toPublic()),
      total
    };
  }

  public async performerSearch(
    req: PhotoSearchRequest,
    user: UserDto,
    jwToken: string
  ): Promise<PageableData<PhotoDto>> {
    const query = {} as any;
    if (req.q) query.title = { $regex: req.q };
    query.performerId = user._id;
    if (req.galleryId) query.galleryId = req.galleryId;
    if (req.status) query.status = req.status;
    const [data, total] = await Promise.all([
      this.PhotoModel
        .find(query)
        .lean()
        .sort('-createdAt')
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.PhotoModel.countDocuments(query)
    ]);

    const performerIds = data.map((d) => d.performerId);
    const galleryIds = data.map((d) => d.galleryId);
    const fileIds = data.map((d) => d.fileId);
    const [performers, galleries, files] = await Promise.all([
      performerIds.length ? this.performerService.findByIds(performerIds) : [],
      galleryIds.length ? this.galleryService.findByIds(galleryIds) : [],
      fileIds.length ? this.fileService.findByIds(fileIds) : []
    ]);
    const photos = data.map((photo) => {
      const performer = photo.performerId
        && performers.find((p) => p._id.toString() === photo.performerId.toString());

      const gallery = photo.galleryId
        && galleries.find((p) => p._id.toString() === photo.galleryId.toString());

      const file = photo.fileId
        && files.find((f) => f._id.toString() === photo.fileId.toString());

      const dto = plainToInstance(PhotoDto, photo);
      dto.setGallery(gallery);
      dto.setPerformer(performer);
      dto.setPhoto(file, { jwt: jwToken });

      return dto;
    });

    return {
      data: photos,
      total
    };
  }
}
