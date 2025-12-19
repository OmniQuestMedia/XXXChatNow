import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PerformerService } from 'src/modules/performer/services';
import { FilterQuery, Model } from 'mongoose';
import { UsernameExistedException } from 'src/modules/user/exceptions';
import { EmailExistedException } from 'src/modules/performer/exceptions';
import { ObjectId } from 'mongodb';
import {
  EntityNotFoundException,
  QueueEvent,
  QueueEventService
} from 'src/kernel';
import { FileService } from 'src/modules/file/services';
import { FileDto } from 'src/modules/file';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { StudioDto } from '../dtos';
import { StudioUpdatePayload } from '../payloads';
import {
  STUDIO_CHANNEL,
  STUDIO_EVENT_NAME,
  STUDIO_STATUES
} from '../constants';
import { Studio } from '../schemas';

@Injectable()
export class StudioService {
  constructor(
    @InjectModel(Studio.name) private readonly StudioModel: Model<Studio>,
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    private readonly queueEventService: QueueEventService
  ) { }

  public async findById(id: string | ObjectId): Promise<StudioDto> {
    const studio = await this.StudioModel.findById(id);
    if (!studio) return null;
    return plainToInstance(StudioDto, studio.toObject());
  }

  public async find(condition: FilterQuery<Studio> = {}): Promise<Array<StudioDto>> {
    const items = await this.StudioModel.find(condition);
    return items.map((item) => plainToInstance(StudioDto, item.toObject()));
  }

  public async findOne(filter: FilterQuery<Studio>): Promise<StudioDto> {
    const studio = await this.StudioModel.findOne(filter);
    if (!studio) return null;
    return plainToInstance(StudioDto, studio.toObject());
  }

  public async findByIds(ids: string[] | ObjectId[]): Promise<Array<StudioDto>> {
    const studios = await this.StudioModel
      .find({
        _id: {
          $in: ids
        }
      })
      .exec();
    return studios.map((item) => plainToInstance(StudioDto, item.toObject()));
  }

  public async findByEmail(email: string) {
    const studio = await this.StudioModel.findOne({ email: email.toLowerCase() });
    if (!studio) return null;
    return plainToInstance(StudioDto, studio.toObject());
  }

  public async register(payload): Promise<StudioDto> {
    const data = {
      ...payload,
      roles: payload.roles || ['studio'],
      updatedAt: new Date(),
      createdAt: new Date()
    } as any;
    const userNameCheck = await this.StudioModel.countDocuments({
      username: payload.username.toLowerCase().trim()
    });
    if (userNameCheck) throw new UsernameExistedException();

    const emailCheck = await this.StudioModel.countDocuments({
      email: payload.email.toLowerCase().trim()
    });
    if (emailCheck) throw new EmailExistedException();

    if (payload.documentVerificationId) {
      const file = await this.fileService.findById(
        payload.documentVerificationId
      );
      if (!file) {
        throw new EntityNotFoundException(
          'Verification Document is not found!'
        );
      }
    }

    const studio = await this.StudioModel.create(data);
    if (payload.documentVerificationId) {
      await this.fileService.addRef(payload.documentVerificationId, {
        itemId: studio._id,
        itemType: 'studio-document'
      });
    }

    const event: QueueEvent = {
      channel: STUDIO_CHANNEL,
      eventName: STUDIO_EVENT_NAME.CREATED,
      data: studio
    };
    await this.queueEventService.publish(event);
    return new StudioDto(studio);
  }

  public async update(id: string | ObjectId, payload: Partial<StudioUpdatePayload>): Promise<StudioDto> {
    const studio = await this.StudioModel.findById(id);
    if (!studio) {
      throw new EntityNotFoundException();
    }

    const data: Record<string, any> = {
      ...payload
    };
    if (
      payload.email
      && payload.email.toLowerCase() !== studio.email.toLowerCase()
    ) {
      const emailCheck = await this.StudioModel.countDocuments({
        email: payload.email.toLowerCase(),
        _id: {
          $ne: studio._id
        }
      });
      if (emailCheck) {
        throw new EmailExistedException();
      }
      data.email = payload.email.toLowerCase();
    }

    if (payload.username && payload.username !== studio.username) {
      const usernameCheck = await this.StudioModel.countDocuments({
        username: studio.username.toLowerCase(),
        _id: { $ne: studio._id }
      });
      if (usernameCheck) throw new UsernameExistedException();

      data.username = payload.username.toLowerCase();
    }
    if (payload.documentVerificationId) {
      const file = await this.fileService.findById(
        payload.documentVerificationId
      );
      if (!file) {
        throw new EntityNotFoundException(
          'Verification Document is not found!'
        );
      }
    }

    await this.StudioModel.updateOne({ _id: id }, data);
    return this.findById(studio._id);
  }

  public async increaseStats(id: string | ObjectId, payload: Record<string, number>) {
    await this.StudioModel.updateOne({ _id: id }, { $inc: payload });
  }

  public async uploadDocument(studio: StudioDto, fileId: ObjectId) {
    await this.StudioModel.updateOne(
      { _id: studio._id },
      { $set: { documentVerificationId: fileId } }
    );

    await Promise.all([
      this.fileService.addRef(fileId, {
        itemId: studio._id,
        itemType: 'studio-document'
      }),
      studio.documentVerificationId && this.fileService.remove(studio.documentVerificationId)
    ]);
    return true;
  }

  public async search(req) {
    const query = {} as any;
    if (req.q) {
      if (!query.$and) {
        query.$and = [];
      }
      query.$and.push({
        $or: [
          {
            name: { $regex: req.q }
          },
          {
            username: { $regex: req.q }
          },
          {
            email: { $regex: req.q }
          }
        ]
      });
    }
    if (req.status) {
      if (req.status === STUDIO_STATUES.PENDING) {
        if (!query.$and) {
          query.$and = [];
        }
        query.$and.push({
          $or: [{ status: req.status }, { emailVerified: false }]
        });
      } else {
        query.status = req.status;
      }
    }

    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }

    const [data, total] = await Promise.all([
      this.StudioModel
        .find(query)
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.StudioModel.countDocuments(query)
    ]);

    return {
      data: data.map((item) => plainToInstance(StudioDto, item.toObject())),
      total
    };
  }

  public async stats(id: string | ObjectId) {
    const results = await this.findById(id);
    if (!results) {
      throw new EntityNotFoundException();
    }

    const studio = new StudioDto(results);
    const { stats, _id } = studio;
    const [totalOnlineToday, totalHoursOnline] = await Promise.all([
      this.performerService.totalOnlineTodayStat(_id),
      this.performerService.totalHoursOnlineStat(_id)
    ]);

    return { ...stats, totalOnlineToday, totalHoursOnline };
  }

  public async detail(id: string | ObjectId, jwtToken: string) {
    const result = await this.findById(id);
    if (!result) throw new EntityNotFoundException();

    const studio = new StudioDto(result).toResponse(true);
    if (studio.documentVerificationId) {
      const documentVerification = await this.fileService.findById(
        studio.documentVerificationId
      );

      if (documentVerification) {
        const documentVerificationFileURL = jwtToken
          ? `${FileDto.getPublicUrl(documentVerification.path)}?documentId=${documentVerification._id
          }&token=${jwtToken}`
          : FileDto.getPublicUrl(documentVerification.path);
        studio.documentVerificationFile = documentVerificationFileURL;
        studio.documentVerification = {
          _id: documentVerification._id,
          name: documentVerification.name,
          url: documentVerificationFileURL,
          mimeType: documentVerification.mimeType
        };
      }
    }

    return studio;
  }

  public async getMe(id: string | ObjectId, jwtToken: string) {
    const result = await this.detail(id, jwtToken);
    const defaultCommission = SettingService.getValueByKey(SETTING_KEYS.STUDIO_COMMISSION);
    if (!result.commission) result.commission = defaultCommission;
    if (!result.tipCommission) result.tipCommission = defaultCommission;
    if (!result.privateCallCommission) result.privateCallCommission = defaultCommission;
    if (!result.groupCallCommission) result.groupCallCommission = defaultCommission;
    if (!result.productCommission) result.productCommission = defaultCommission;
    if (!result.albumCommission) result.albumCommission = defaultCommission;
    if (!result.videoCommission) result.videoCommission = defaultCommission;

    return result;
  }

  public async increaseBalance(id: string | ObjectId, amount: number) {
    return this.StudioModel.updateOne(
      { _id: id },
      {
        $inc: {
          balance: amount,
          'stats.totalTokenEarned': amount > 0 ? amount : 0,
          'stats.totalTokenSpent': amount <= 0 ? amount : 0
        }
      }
    );
  }

  public async updateBalance(id: string | ObjectId, balance: number) {
    return this.StudioModel.updateOne(
      { _id: id },
      {
        balance
      }
    );
  }

  public async updateVerificationStatus(studioId: string | ObjectId, emailVerified = true): Promise<void> {
    await this.StudioModel.updateOne(
      {
        _id: studioId
      },
      { emailVerified }
    );
  }

  public async countByStatus(status: string) {
    return this.StudioModel.countDocuments({
      status
    });
  }
}
