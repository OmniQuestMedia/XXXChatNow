import { Injectable } from '@nestjs/common';
import { UserService } from 'src/modules/user/services';
import { StudioService } from 'src/modules/studio/services';
import { PerformerService } from 'src/modules/performer/services';
import {
  GalleryService, PhotoService, ProductService, VideoService
} from 'src/modules/performer-assets/services';
import { EarningService } from 'src/modules/earning/services/earning.service';
import { OrderService } from 'src/modules/payment/services';
import { STATUS_ACTIVE, STATUS_INACTIVE, STATUS_PENDING } from '../../user/constants';
import { PERFORMER_STATUSES } from '../../performer/constants';
import { ORDER_STATUS } from '../../payment/constants';
import { } from '.';

@Injectable()
export class StatisticService {
  constructor(
    private readonly userService: UserService,
    private readonly performerService: PerformerService,
    private readonly studioService: StudioService,
    private readonly performerVideoService: VideoService,
    private readonly performerProductService: ProductService,
    private readonly performerPhotoService: PhotoService,
    private readonly performerGalleryService: GalleryService,
    private readonly earningService: EarningService,
    private readonly orderService: OrderService
  ) { }

  public async dashboardStats(): Promise<any> {
    const [totalActiveUsers, totalInactiveUsers, totalPendingUsers] = await Promise.all([
      this.userService.countByStatus(STATUS_ACTIVE),
      this.userService.countByStatus(STATUS_INACTIVE),
      this.userService.countByStatus(STATUS_PENDING)
    ]);

    const [totalActivePerformers, totalInactivePerformers, totalPendingPerformers] = await Promise.all([
      this.performerService.countByStatus(STATUS_ACTIVE),
      this.performerService.countByStatus(STATUS_INACTIVE),
      this.performerService.countByStatus(PERFORMER_STATUSES.PENDING)
    ]);

    const [totalActiveStudio, totalInactiveStudio, totalPendingStudio] = await Promise.all([
      this.studioService.countByStatus(STATUS_ACTIVE),
      this.studioService.countByStatus(STATUS_INACTIVE),
      this.studioService.countByStatus(STATUS_PENDING)
    ]);
    const totalGalleries = await this.performerGalleryService.countTotalGalleries();
    const totalPhotos = await this.performerPhotoService.countTotalPhotos();
    const totalVideos = await this.performerVideoService.countTotalVideos();
    const [totalDeliverdOrders, totalShippingdOrders, totalRefundedOrders] = await Promise.all([
      this.orderService.countByDeliveryStatus(ORDER_STATUS.DELIVERED),
      this.orderService.countByDeliveryStatus(ORDER_STATUS.SHIPPING),
      this.orderService.countByDeliveryStatus(ORDER_STATUS.REFUNDED)
    ]);
    const totalProducts = await this.performerProductService.countTotalVideos();
    const [totalGrossPrice, totalNetPrice, totalStreamTime] = await Promise.all([
      this.earningService.getTotalGrossPrice(),
      this.earningService.getTotalNetPrice(),
      this.performerService.getTotalStreamTime()
    ]);
    return {
      totalActiveUsers,
      totalInactiveUsers,
      totalPendingUsers,
      totalActivePerformers,
      totalInactivePerformers,
      totalPendingPerformers,
      totalActiveStudio,
      totalInactiveStudio,
      totalPendingStudio,
      totalGalleries,
      totalPhotos,
      totalVideos,
      totalProducts,
      totalDeliverdOrders,
      totalShippingdOrders,
      totalRefundedOrders,
      totalStreamTime,
      totalGrossPrice,
      totalNetPrice
    };
  }
}
