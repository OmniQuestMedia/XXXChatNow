import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { UserService } from 'src/modules/user/services';
import { PerformerService } from 'src/modules/performer/services';
import { UserDto } from 'src/modules/user/dtos';
import { FileService } from 'src/modules/file/services';
import { FilterQuery, Model } from 'mongoose';
import * as moment from 'moment';
import { GalleryService, PhotoService, VideoService } from 'src/modules/performer-assets/services';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { PerformerScheduleDto } from 'src/modules/performer-schedule/dtos/performer-schedule.dto';
import { PerformerScheduleService } from 'src/modules/performer-schedule/services/performer-schedule.service';
import { PaymentTokenSearchPayload } from '../payloads';
import { PurchasedItemDto } from '../dtos';
import { PURCHASE_ITEM_TYPE } from '../constants';
import { PurchasedItem } from '../schemas';

@Injectable()
export class PurchasedItemSearchService {
  constructor(
    @InjectModel(PurchasedItem.name) private readonly PurchasedItemModel: Model<PurchasedItem>,

    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,

    @Inject(forwardRef(() => VideoService))
    private readonly videoService: VideoService,
    @Inject(forwardRef(() => GalleryService))
    private readonly galleryService: GalleryService,
    @Inject(forwardRef(() => PhotoService))
    private readonly photoService: PhotoService,
    @Inject(forwardRef(() => PerformerScheduleService))
    private readonly performerScheduleService: PerformerScheduleService
  ) { }

  public async getUserTransactionsToken(
    req: PaymentTokenSearchPayload,
    user: UserDto
  ) {
    const query: FilterQuery<PurchasedItem> = {
      sourceId: user._id
    };
    if (req.type) query.type = req.type;
    if (req.status) query.status = req.status;
    if (req.sellerId) query.sellerId = req.sellerId;
    if (req.performerId) query.sellerId = req.sellerId;
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: moment(req.fromDate).startOf('day'),
        $lt: moment(req.toDate).endOf('day')
      };
    }
    const sort: any = {
      [req.sortBy || 'updatedAt']: req.sort || -1
    };
    const [data, total] = await Promise.all([
      this.PurchasedItemModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.PurchasedItemModel.countDocuments(query)
    ]);
    const performerIds = data.filter((d) => d.sellerId).map((d) => d.sellerId);
    const performers = performerIds.length
      ? await this.performerService.findByIds(performerIds)
      : [];

    const dtos = data.map((d) => plainToInstance(PurchasedItemDto, d));
    dtos.forEach((dto) => {
      if (dto.sellerId) {
        const performer = performers.find((p) => p._id.toString() === dto.sellerId.toString());
        dto.setSellerInfo(performer);
      }
    });
    await this._mapVideoInfo(dtos);
    await this._mapGalleryInfo(dtos);

    return {
      total,
      data: dtos
    };
  }

  public async adminGetUserTransactionsToken(req: PaymentTokenSearchPayload) {
    const query = {} as any;
    if (req.sourceId) query.sourceId = req.sourceId;
    if (req.source) query.source = req.source;
    if (req.type) query.type = req.type;
    if (req.status) query.status = req.status;
    if (req.target) query.target = req.target;
    if (req.targetId) query.targetId = req.targetId;
    if (req.sellerId) query.sellerId = req.sellerId;
    if (req.performerId) query.sellerId = req.sellerId;
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: moment(req.fromDate).startOf('day'),
        $lt: moment(req.toDate).endOf('day')
      };
    }
    const sort: any = {
      [req.sortBy || 'updatedAt']: req.sort || -1
    };
    const [data, total] = await Promise.all([
      this.PurchasedItemModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.PurchasedItemModel.countDocuments(query)
    ]);
    const sourceIds = data.filter((d) => d.source === 'user').map((d) => d.sourceId);
    const sellerIds = data.map((d) => d.sellerId);
    const [users, performers] = await Promise.all([
      sourceIds.length ? this.userService.findByIds(sourceIds) : [],
      sellerIds ? this.performerService.findByIds(sellerIds) : []
    ]);

    const dtos = data.map((d) => plainToInstance(PurchasedItemDto, d));
    dtos.forEach((dto) => {
      const performer = performers.find((p) => p._id.toString() === dto.sellerId.toString());
      dto.setSellerInfo(performer);
      const user = users.find((u) => u._id.toString() === dto.sourceId.toString());
      dto.setSourceInfo(user);
    });

    return {
      total,
      data: dtos
    };
  }

  public async userSearchPurchasedItem(query: FilterQuery<PurchasedItem>, sort, req: Record<string, any>) {
    const [data, total] = await Promise.all([
      this.PurchasedItemModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(parseInt(req.limit, 10))
        .skip(parseInt(req.offset, 10)),
      this.PurchasedItemModel.countDocuments(query)
    ]);

    return {
      total,
      data: data.map((d) => plainToInstance(PurchasedItemDto, d))
    };
  }

  private async _mapVideoInfo(purchasedItems: PurchasedItemDto[]) {
    const videoIds = purchasedItems.filter((p) => p.type === PURCHASE_ITEM_TYPE.SALE_VIDEO).map((p) => p.targetId);
    if (!videoIds) return;
    const videos = await this.videoService.findByIds(videoIds);
    if (!videos.length) return;

    const videoFileIds = videos
      .filter((v) => v.fileId)
      .map((v) => v.fileId);
    const videoFiles = videoFileIds.length ? await this.fileService.findByIds(videoFileIds) : [];
    videos.forEach((v) => {
      if (v.fileId) {
        const videoFile = videoFiles.find((f) => f._id.toString() === v.fileId.toString());
        if (videoFile) {
          v.setVideo(videoFile);
        }
      }
    });
    purchasedItems.forEach((p) => {
      const video = p.targetId && videos.find((v) => p.targetId.toString() === v._id.toString());
      p.setTargetInfo(video);
    });
  }

  private async _mapGalleryInfo(purchasedItems: PurchasedItemDto[]) {
    const galleryIds = purchasedItems.filter((p) => p.type === PURCHASE_ITEM_TYPE.PHOTO).map((p) => p.targetId);
    if (!galleryIds) return;
    const galleries = await this.galleryService.findByIds(galleryIds);
    if (!galleries.length) return;
    const coverPhotoIds = galleries.filter((g) => g.coverPhotoId).map((g) => g.coverPhotoId);
    const coverFiles = coverPhotoIds.length
      ? await this.photoService.find({ _id: { $in: coverPhotoIds } })
      : [];
    if (coverFiles.length) {
      const fileIds = coverFiles.map((c) => c.fileId);
      const files = fileIds.length ? await this.fileService.findByIds(fileIds) : [];
      galleries.forEach((g) => {
        if (g.coverPhotoId) {
          const coverPhoto = coverFiles.find((c) => c._id.toString() === g.coverPhotoId.toString());
          if (coverPhoto) {
            const file = files.find((f) => f._id.toString() === coverPhoto.fileId.toString());
            g.setCoverPhoto(file);
          }
        }
      });
    }

    purchasedItems.forEach((p) => {
      const gallery = p.targetId && galleries.find((g) => p.targetId.toString() === g._id.toString());
      p.setTargetInfo(gallery);
    });
  }

  private async _mapEventPassInfo(purchasedItems: PurchasedItemDto[]) {
    const eventPassIds = purchasedItems.filter((p) => p.type === PURCHASE_ITEM_TYPE.EVENT_PASS).map((p) => p.targetId);
    if (!eventPassIds) return;
    const eventsPassModel = await this.performerScheduleService.findByIds(eventPassIds);
    if (!eventsPassModel.length) return;
    const eventsPass = eventsPassModel.map((v) => plainToInstance(PerformerScheduleDto, v));
    purchasedItems.forEach((p) => {
      const eventPass = p.targetId && eventsPass.find((v) => p.targetId.toString() === v._id.toString());
      // eslint-disable-next-line no-param-reassign
      if (eventPass) p.targetInfo = eventPass;
    });
  }
}
