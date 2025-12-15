import { Injectable, Logger } from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { AgendaService, EntityNotFoundException } from 'src/kernel';
import { Job } from 'agenda';
import { PerformerService } from 'src/modules/performer/services';
import * as moment from 'moment';
import { PurchaseItemService } from 'src/modules/purchased-item/services';
import { InjectModel } from '@nestjs/mongoose';
import { FeaturedCreatorBookingSearchPayload, FeaturedCreatorBookingStatusSearchPayload } from '../payloads';
import { FeaturedCreatorPackageService } from './featured-creator-package.service';
import { FeaturedCreatorBookingStatus } from '../schemas';
import { FeaturedCreatorStatusDto } from '../dtos';

@Injectable()
export class FeaturedCreatorApprovedService {
  private logger = new Logger();

  constructor(
    @InjectModel(FeaturedCreatorBookingStatus.name) private readonly featuredCreatorStatusModel: Model<FeaturedCreatorBookingStatus>,

    private readonly agendaService: AgendaService,
    private readonly performerService: PerformerService,
    private readonly packageService: FeaturedCreatorPackageService,
    private readonly paymentService: PurchaseItemService
  ) {
    this.agendaService.define('FEATURED_CREATOR_PAYMENT_DAILY_SCHEDULE', {}, this.handler.bind(this));
  }

  async handler(job: Job, done: any) {
    try {
      const { id } = job.attrs.data;
      const featured = await this.featuredCreatorStatusModel.findById(id);
      if (!featured) return;

      if (featured.status !== 'active') return;

      const [performer, fpackage] = await Promise.all([
        this.performerService.findById(featured.performerId),
        this.packageService.findById(featured.packageId)
      ]);

      if (performer && performer.balance < fpackage.price) {
        featured.status = 'inactive';
        await featured.save();
        return;
      }

      const res = await this.paymentService.payForFeaturedCreator({
        ...featured,
        price: fpackage.price
      });
      if (res.success) {
        await this.agendaService.schedule(moment().add(24, 'hours').toDate(), 'FEATURED_CREATOR_PAYMENT_DAILY_SCHEDULE', {});
        return;
      }

      featured.status = 'inactive';
      await featured.save();
    } catch (e) {
      this.logger.error(e);
    } finally {
      done();
    }
  }

  public async search(req: FeaturedCreatorBookingSearchPayload) {
    const query: FilterQuery<FeaturedCreatorStatusDto> = {};

    const [data, total] = await Promise.all([
      this.featuredCreatorStatusModel.find(query).limit(+req.limit).skip(+req.offset).lean(),
      this.featuredCreatorStatusModel.countDocuments(query)
    ]);

    const packageIds = data.map((item) => item.packageId);
    const performerIds = data.map((item) => item.performerId);
    const packs = await this.packageService.findBydIds(packageIds);
    const performers = await this.performerService.findByIds(performerIds);

    return {
      data: data.map((item: any) => {
        const pack = item.packageId && packs.find((p) => item.packageId.toString() === p._id.toString());
        const performer = item.performerId && performers.find((p) => item.performerId.toString() === p._id.toString());

        return { ...item, package: pack, performer };
      }),
      total
    };
  }

  public async userSearch(req: FeaturedCreatorBookingStatusSearchPayload) {
    const now = new Date();

    const query: FilterQuery<FeaturedCreatorStatusDto> = {
      endDate: { $gt: now }
    };

    const [data, total] = await Promise.all([
      this.featuredCreatorStatusModel
        .find(query)
        .limit(+req.limit || 10)
        .skip(+req.offset || 0)
        .lean(),
      this.featuredCreatorStatusModel.countDocuments(query)
    ]);

    if (!data.length) {
      return {
        data: [],
        total: 0
      };
    }

    const packageIds = data.map((item) => item.packageId).filter(Boolean);
    const performerIds = data.map((item) => item.performerId).filter(Boolean);

    const [packs, performers] = await Promise.all([
      this.packageService.findBydIds(packageIds),
      this.performerService.findByIds(performerIds)
    ]);

    return {
      data: data.map((item: any) => {
        const pack = packs.find((p) => p._id.toString() === item.packageId?.toString());
        const performer = performers.find((p) => p._id.toString() === item.performerId?.toString());

        return { ...item, package: pack, performer };
      }),
      total
    };
  }

  public create(data: any) {
    return this.featuredCreatorStatusModel.create(data);
  }

  public async cancel(id: string) {
    const data = await this.featuredCreatorStatusModel.findById(id);
    if (!data) throw new EntityNotFoundException();

    data.status = 'inactive';
    await data.save();
    return true;
  }
}
