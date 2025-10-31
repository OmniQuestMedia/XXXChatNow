import {
  BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable
} from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { PerformerDto } from 'src/modules/performer/dtos';
import * as moment from 'moment';
import { ObjectId } from 'mongodb';
import { plainToClass } from 'class-transformer';
import { EntityNotFoundException, PageableData, QueueEventService } from 'src/kernel';
import { isObjectId } from 'src/kernel/helpers/string.helper';
import { merge, uniq } from 'lodash';
import { PerformerService } from 'src/modules/performer/services';
import { InjectModel } from '@nestjs/mongoose';
import { EVENT } from 'src/kernel/constants';
import { PerformerScheduleCreatePayload, PerformerScheduleSearchPayload, PerformerScheduleUpdatePayload } from '../payloads';
import { PerformerScheduleDto } from '../dtos';
import { PerformerSchedule } from '../schemas';

@Injectable()
export class PerformerScheduleService {
  constructor(
         @InjectModel(PerformerSchedule.name) private readonly PerformerScheduleModel: Model<PerformerSchedule>,
        private readonly performerService: PerformerService,
            private readonly queueEventService: QueueEventService
  ) { }

  async findOne(id: string | ObjectId): Promise<PerformerScheduleDto> {
    const schedule = await this.PerformerScheduleModel.findOne({ _id: id }).lean();
    if (!schedule) {
      throw new EntityNotFoundException();
    }
    const { performerId } = schedule;
    const performer = performerId && (await this.performerService.findById(performerId));
    const dto = plainToClass(PerformerScheduleDto, { ...schedule });
    dto.performer = performer;

    return dto;
  }

  async findById(id: string | ObjectId) {
    return this.PerformerScheduleModel.findOne({ _id: id });
  }

  async findByIds(Ids: string[] | ObjectId[]) {
    const data = await this.PerformerScheduleModel.find({ _id: { $in: Ids } });
    return data;
  }

  async create(
    payload: PerformerScheduleCreatePayload,
    performer: PerformerDto
  ): Promise<PerformerScheduleDto> {
    if (moment(payload.startAt) < moment()) {
      throw new HttpException('Please choose a future date', HttpStatus.BAD_REQUEST);
    }

    if (moment(payload.startAt) > moment(payload.endAt)) {
      throw new BadRequestException();
    }

    const data = { ...payload, performerId: performer._id };
    const schedule = await this.PerformerScheduleModel.create(data);

    await this.queueEventService.publish({
      eventName: EVENT.CREATED,
      channel: 'PERFORMER_SCHEDULE_CHANNEL',
      data: {
        schedule: schedule.toObject(),
        performer
      }
    });

    return plainToClass(PerformerScheduleDto, schedule.toObject());
  }

  async search(
    req: PerformerScheduleSearchPayload
  ): Promise<PageableData<PerformerScheduleDto>> {
    const query: FilterQuery<PerformerSchedule> = {};

    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
        'i'
      );
      query.$or = [
        {
          title: { $regex: regexp }
        },
        {
          description: { $regex: regexp }
        }
      ];
    }

    if (req.status) query.status = req.status;

    if (isObjectId(req.performerId)) query.performerId = req.performerId;

    if (req.startAt && req.endAt) {
      query.startAt = { $gt: moment(req.startAt).startOf('date').toDate() };
      query.endAt = { $lt: moment(req.endAt).endOf('date').toDate() };
    }

    const sort = {
      [req.sortBy || 'updatedAt']: req.sort || 'desc'
    };

    const [schedules, total] = await Promise.all([
      this.PerformerScheduleModel
        .find(query)
        .sort(sort)
        .lean()
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.PerformerScheduleModel.countDocuments(query)
    ]);

    const performerIds = uniq(schedules.map((d) => d.performerId));
    const performers = await this.performerService.findByIds(performerIds);
    const data = schedules.map((schedule) => {
      const performer = schedule.performerId && performers.find((d) => d._id.equals(schedule.performerId));
      if (performer) {
        return plainToClass(PerformerScheduleDto, {
          ...schedule,
          performer: new PerformerDto(performer).toResponse()
        });
      }

      return plainToClass(PerformerScheduleDto, schedule);
    });

    return { data, total };
  }

  async update(
    id: string | ObjectId,
    payload: PerformerScheduleUpdatePayload,
    performer: PerformerDto
  ): Promise<PerformerScheduleDto> {
    const schedule = await this.findById(id);
    if (!schedule) {
      throw new EntityNotFoundException();
    }

    if (!schedule.performerId.equals(performer._id)) {
      throw new ForbiddenException();
    }

    if (payload.startAt && moment(payload.startAt) < moment()) {
      throw new HttpException('Please choose a future date', HttpStatus.BAD_REQUEST);
    }

    if (payload.startAt && moment(payload.startAt) > moment(payload.endAt)) {
      throw new BadRequestException();
    }

    if (payload.startAt) {
      const count = await this.PerformerScheduleModel.countDocuments({
        userId: schedule.performerId,
        $and: [
          { endAt: { $gte: payload.startAt } },
          { startAt: { $lte: payload.startAt } }
        ],
        _id: { $ne: id }
      });
      if (count) {
        throw new HttpException('Invalid start time', HttpStatus.BAD_REQUEST);
      }
    }

    merge(schedule, payload);
    schedule.updatedAt = new Date();
    await schedule.save();
    return plainToClass(PerformerScheduleDto, schedule.toObject());
  }

  async delete(id: string | ObjectId, performer: PerformerDto) {
    const schedule = await this.findById(id);
    if (!schedule) {
      throw new EntityNotFoundException();
    }

    if (!schedule.performerId.equals(performer._id)) {
      throw new ForbiddenException();
    }

    await schedule.deleteOne();
    return true;
  }
}
