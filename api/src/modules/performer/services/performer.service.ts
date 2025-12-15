import {
  Injectable, Inject, forwardRef, ForbiddenException, BadRequestException
} from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { UserDto } from 'src/modules/user/dtos';
import {
  EntityNotFoundException,
  QueueEvent,
  QueueEventService
} from 'src/kernel';
import { ObjectId } from 'mongodb';
import {
  DELETE_FILE_TYPE,
  FileService,
  FILE_EVENT,
  MEDIA_FILE_CHANNEL
} from 'src/modules/file/services';
import { FileDto } from 'src/modules/file';
import { EVENT, STATUS } from 'src/kernel/constants';
import { UserService } from 'src/modules/user/services';
import { merge, uniq } from 'lodash';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import * as moment from 'moment';
import {
  PERFORMER_CHANNEL,
  PERFORMER_STEAMING_STATUS_CHANNEL
} from 'src/modules/performer/constants';
import { USER_SOCKET_EVENT } from 'src/modules/socket/constants';
import { OFFLINE } from 'src/modules/stream/constant';
import { toObjectId } from 'src/kernel/helpers/string.helper';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { ReferralService } from 'src/modules/referral/services/referral.service';
import { REFERRAL_CHANNEL } from 'src/modules/referral/contants';
import { WheelService } from 'src/modules/wheel/services';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { MailerService } from 'src/modules/mailer/services/mailer.service';
import {
  PERFORMER_STATUSES,
  BLOCK_USERS_CHANNEL,
  BLOCK_ACTION
} from '../constants';
import { PerformerBroadcastSetting } from '../payloads/performer-broadcast-setting.payload';
import { PerformerCommissionService, WatermarkSettingService } from './index';
import { PerformerDto, BlockSettingDto } from '../dtos';
import { UsernameExistedException, EmailExistedException } from '../exceptions';
import {
  PerformerCreatePayload,
  PerformerUpdatePayload,
  BlockSettingPayload,
  PerformerRegisterPayload,
  DefaultPricePayload,
  PerformerSearchPayload
} from '../payloads';
import { CategoryService } from './category.service';
import { BlockSetting, Performer } from '../schemas';

@Injectable()
export class PerformerService {
  constructor(
    @InjectModel(Performer.name) private readonly PerformerModel: Model<Performer>,
    @InjectModel(BlockSetting.name) private readonly BlockSettingModel: Model<BlockSetting>,
    private readonly userService: UserService,
    private readonly queueEventService: QueueEventService,
    private readonly categoryService: CategoryService,
    private readonly socketUserService: SocketUserService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @Inject(forwardRef(() => PerformerCommissionService))
    private readonly performerCommissionService: PerformerCommissionService,
    @Inject(forwardRef(() => WatermarkSettingService))
    private readonly watermarkService: WatermarkSettingService,
    @Inject(forwardRef(() => ReferralService))
    private readonly referralService: ReferralService,
    @Inject(forwardRef(() => WheelService))
    private readonly wheelService: WheelService,
    @Inject(forwardRef(() => MailerService))
    private readonly mailerService: MailerService
  ) { }

  public async findOne(filter: FilterQuery<Performer>): Promise<PerformerDto> {
    const model = await this.PerformerModel.findOne(filter);
    if (!model) return null;

    const dto = plainToInstance(PerformerDto, model.toObject());
    if (model.avatarId) {
      const avatar = await this.fileService.findById(model.avatarId);
      model.avatarPath = avatar ? FileDto.getPublicUrl(avatar.path) : null;
    }

    return dto;
  }

  public async findById(id: string | ObjectId): Promise<PerformerDto> {
    const model = await this.PerformerModel.findById(id);
    if (!model) return null;
    const dto = plainToInstance(PerformerDto, model.toObject());

    if (model.avatarId) {
      const avatar = await this.fileService.findById(model.avatarId);
      dto.avatarPath = avatar ? FileDto.getPublicUrl(avatar.path) : null;
    }
    return dto;
  }

  public async findAllIndividualPerformers(): Promise<Array<PerformerDto>> {
    const items = await this.PerformerModel.find({
      studioId: null
    });
    return items.map((item) => plainToInstance(PerformerDto, item.toObject()));
  }

  public async checkBlockedByIp(blockSettings: Record<string, any>, countryCode: string): Promise<boolean> {
    if (blockSettings?.countries?.length) {
      return blockSettings.countries.indexOf(countryCode) > -1;
    }

    return false;
  }

  public async checkBlockedByPerformer(
    blockSettings: any,
    userId: string | ObjectId
  ): Promise<boolean> {
    if (blockSettings?.userIds?.length) {
      return blockSettings.userIds.indexOf(userId) > -1;
    }

    return false;
  }

  public async findByUsername(
    username: string,
    countryCode?: string,
    currentUser?: UserDto
  ): Promise<PerformerDto> {
    const findUsername = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const model = await this.PerformerModel.findOne({ username: findUsername });
    if (!model) return null;
    const dto = new PerformerDto(model);
    let isBlocked = false;
    const blockSettings = await this.BlockSettingModel.findOne({
      performerId: model._id
    });

    if (countryCode && blockSettings) {
      isBlocked = await this.checkBlockedByIp(blockSettings, countryCode);
    }
    let isBlockedByPerformer = false;
    if (currentUser && blockSettings) {
      isBlockedByPerformer = await this.checkBlockedByPerformer(
        blockSettings,
        currentUser._id
      );
    }
    dto.isBlocked = !!(isBlocked || isBlockedByPerformer);
    if (model.avatarId) {
      const avatar = await this.fileService.findById(model.avatarId);
      dto.avatarPath = avatar ? avatar.path : null;
    }
    const wheelOptions = await this.wheelService.find({ performerId: model._id, status: 'active' });
    if (wheelOptions) {
      dto.wheelOptions = wheelOptions;
    }

    return dto;
  }

  public async findByEmail(email: string): Promise<PerformerDto> {
    const model = await this.PerformerModel.findOne({
      email: email.toLowerCase()
    });
    if (!model) return null;
    return plainToInstance(PerformerDto, model.toObject());
  }

  public async find(condition: FilterQuery<Performer> = {}): Promise<PerformerDto[]> {
    const models = await this.PerformerModel.find(condition).exec();
    return models.map((p) => plainToInstance(PerformerDto, p.toObject()));
  }

  public async findByIds(ids): Promise<PerformerDto[]> {
    const performers = await this.PerformerModel
      .find({
        _id: {
          $in: ids
        }
      })
      .lean()
      .exec();
    return performers.map((p) => plainToInstance(PerformerDto, p));
  }

  public async removeStudioId(performerId: string | ObjectId, studioId?: string | ObjectId) {
    const performer = await this.PerformerModel.findById(performerId);
    if (!performer) throw new EntityNotFoundException();
    if (studioId && performer.studioId.toString() !== studioId.toString()) throw new ForbiddenException();

    await this.queueEventService.publish({
      channel: 'STUDIO_MEMBER_CHANNEL',
      eventName: EVENT.UPDATED,
      data: { studioId, total: -1 }
    });
  }

  public async register(payload: Partial<PerformerRegisterPayload>): Promise<PerformerDto> {
    const data = {
      ...payload,
      updatedAt: new Date(),
      createdAt: new Date()
    } as any;
    const userNameCheck = await this.PerformerModel.countDocuments({
      username: payload.username.trim().toLocaleLowerCase()
    });
    if (userNameCheck) {
      throw new UsernameExistedException();
    }

    const emailCheck = await this.PerformerModel.countDocuments({
      email: payload.email.toLowerCase().trim()
    });
    if (emailCheck) {
      throw new EmailExistedException();
    }

    if (payload.avatarId) {
      const avatar = await this.fileService.findById(payload.avatarId);
      if (!avatar) {
        throw new EntityNotFoundException('Avatar not found!');
      }
      // TODO - check for other storaged
      data.avatarPath = avatar.path;
    }

    const performer = await this.PerformerModel.create(data);

    await Promise.all([
      payload.idVerificationId
      && this.fileService.addRef(payload.idVerificationId, {
        itemId: performer._id,
        itemType: 'performer-id-verification'
      }),
      payload.documentVerificationId
      && this.fileService.addRef(payload.documentVerificationId, {
        itemId: performer._id,
        itemType: 'performer-document-verification'
      }),
      payload.avatarId
      && this.fileService.addRef(payload.avatarId, {
        itemId: performer._id,
        itemType: 'performer-avatar'
      })
    ]);

    await this.queueEventService.publish(
      new QueueEvent({
        channel: PERFORMER_CHANNEL,
        eventName: EVENT.CREATED,
        data: {
          id: performer._id
        }
      })
    );

    if (payload.rel) {
      await this.referralService.newReferral({
        registerSource: 'performer',
        registerId: performer._id,
        code: payload.rel
      });

      const referral = await this.referralService.findOne({ registerId: performer._id.toString() });

      await this.queueEventService.publish(
        new QueueEvent({
          channel: REFERRAL_CHANNEL,
          eventName: EVENT.CREATED,
          data: {
            referral,
            memberRoles: 'performer'
          }
        })
      );
    }

    // TODO - fire event?
    return new PerformerDto(performer);
  }

  public async getDetails(
    id: string | ObjectId,
    jwtToken: string
  ): Promise<PerformerDto> {
    const performer = await this.PerformerModel.findById(id);
    if (!performer) {
      throw new EntityNotFoundException();
    }

    const {
      avatarId,
      documentVerificationId,
      idVerificationId,
      releaseFormId,
      categoryIds
    } = performer;
    const [
      avatar,
      documentVerification,
      idVerification,
      releaseForm,
      commission,
      categories
    ] = await Promise.all([
      avatarId && this.fileService.findById(avatarId),
      documentVerificationId
      && this.fileService.findById(documentVerificationId),
      idVerificationId && this.fileService.findById(idVerificationId),
      releaseFormId && this.fileService.findById(releaseFormId),
      this.performerCommissionService.findByPerformerId(id),
      categoryIds
        ? this.categoryService.find({ _id: { $in: categoryIds } })
        : []
    ]);

    // TODO - update kernel for file dto
    const dto = new PerformerDto(performer);
    dto.categories = categories ? categories.map((c) => c.name) : [];
    dto.avatar = avatar ? FileDto.getPublicUrl(avatar.path) : null; // TODO - get default avatar
    dto.idVerification = idVerification
      ? {
        _id: idVerification._id,
        name: idVerification.name,
        url: jwtToken
          ? `${FileDto.getPublicUrl(idVerification.path)}?documentId=${idVerification._id
          }&token=${jwtToken}`
          : FileDto.getPublicUrl(idVerification.path),
        mimeType: idVerification.mimeType
      }
      : null;
    dto.documentVerification = documentVerification
      ? {
        _id: documentVerification._id,
        name: documentVerification.name,
        url: jwtToken
          ? `${FileDto.getPublicUrl(documentVerification.path)}?documentId=${documentVerification._id
          }&token=${jwtToken}`
          : FileDto.getPublicUrl(documentVerification.path),
        mimeType: documentVerification.mimeType
      }
      : null;
    dto.releaseForm = releaseForm
      ? {
        _id: releaseForm._id,
        name: releaseForm.name,
        url: jwtToken
          ? `${FileDto.getPublicUrl(releaseForm.path)}?documentId=${releaseForm._id
          }&token=${jwtToken}`
          : FileDto.getPublicUrl(releaseForm.path),
        mimeType: releaseForm.mimeType
      }
      : null;

    dto.commissionSetting = commission;
    dto.watermark = await this.watermarkService.getPerformerWatermark(performer._id);
    return dto;
  }

  public async create(
    payload: PerformerCreatePayload,
    user?: UserDto
  ): Promise<PerformerDto> {
    const data = {
      ...payload,
      updatedAt: new Date(),
      createdAt: new Date()
    } as any;
    const userNameCheck = await this.PerformerModel.countDocuments({
      username: payload.username.trim()
    });
    if (userNameCheck) {
      throw new UsernameExistedException();
    }

    const emailCheck = await this.PerformerModel.countDocuments({
      email: payload.email.toLowerCase().trim()
    });
    if (emailCheck) {
      throw new EmailExistedException();
    }

    if (payload.avatarId) {
      const avatar = await this.fileService.findById(payload.avatarId);
      if (!avatar) {
        throw new EntityNotFoundException('Avatar not found!');
      }
      // TODO - check for other storaged
      data.avatarPath = avatar.path;
    }

    // TODO - check for category Id, studio
    if (user) {
      data.createdBy = user._id;
    }
    const performer = await this.PerformerModel.create(data);
    await Promise.all([
      payload.idVerificationId
      && this.fileService.addRef(payload.idVerificationId, {
        itemId: performer._id as any,
        itemType: 'performer-id-verification'
      }),
      payload.documentVerificationId
      && this.fileService.addRef(payload.documentVerificationId, {
        itemId: performer._id as any,
        itemType: 'performer-document-verification'
      }),
      payload.releaseFormId
      && this.fileService.addRef(payload.releaseFormId, {
        itemId: performer._id as any,
        itemType: 'performer-release-form'
      }),
      payload.avatarId
      && this.fileService.addRef(payload.avatarId, {
        itemId: performer._id as any,
        itemType: 'performer-avatar'
      })
    ]);

    if (payload.commissionSetting) {
      await this.performerCommissionService.update(
        performer._id,
        payload.commissionSetting
      );
    }

    await this.queueEventService.publish(
      new QueueEvent({
        channel: PERFORMER_CHANNEL,
        eventName: EVENT.CREATED,
        data: {
          id: performer._id
        }
      })
    );

    // TODO - fire event?
    return new PerformerDto(performer);
  }

  public async adminUpdate(
    id: string | ObjectId,
    payload: PerformerUpdatePayload
  ): Promise<any> {
    const performer = await this.PerformerModel.findById(id);
    if (!performer) {
      throw new EntityNotFoundException();
    }

    const data = { ...payload } as any;
    const { studioId } = performer;
    if (!performer.name) {
      data.name = [performer.firstName || '', performer.lastName || '']
        .join(' ')
        .trim();
    }

    if (
      data.email
      && data.email.toLowerCase() !== performer.email.toLowerCase()
    ) {
      const emailCheck = await this.PerformerModel.countDocuments({
        email: data.email.toLowerCase(),
        _id: {
          $ne: performer._id
        }
      });
      if (emailCheck) {
        throw new EmailExistedException();
      }
    }

    if (data.username && data.username !== performer.username) {
      const usernameCheck = await this.PerformerModel.countDocuments({
        username: performer.username,
        _id: { $ne: performer._id }
      });
      if (usernameCheck) {
        throw new UsernameExistedException();
      }
    }

    if (
      (payload.avatarId && !performer.avatarId)
      || (performer.avatarId
        && payload.avatarId
        && payload.avatarId !== performer.avatarId.toString())
    ) {
      const avatar = await this.fileService.findById(payload.avatarId);
      if (!avatar) {
        throw new EntityNotFoundException('Avatar not found!');
      }
      // TODO - check for other storaged
      data.avatarPath = avatar.path;
    }

    await this.PerformerModel.updateOne({ _id: id }, data);

    await Promise.all([
      payload.avatarId
      && this.fileService.addRef(payload.avatarId, {
        itemId: performer._id,
        itemType: 'performer-avatar'
      }),
      payload.documentVerificationId
      && this.fileService.addRef(payload.documentVerificationId, {
        itemId: performer._id,
        itemType: 'performer-document-verification'
      }),
      payload.releaseFormId
      && this.fileService.addRef(payload.releaseFormId, {
        itemId: performer._id,
        itemType: 'performer-release-form'
      }),
      payload.idVerificationId
      && this.fileService.addRef(payload.idVerificationId, {
        itemId: performer._id,
        itemType: 'performer-id-verification'
      })
    ]);

    if (
      payload.documentVerificationId
      && `${payload.documentVerificationId}`
      !== `${performer.documentVerificationId}`
    ) {
      performer.documentVerificationId
        && (await this.fileService.remove(performer.documentVerificationId));
    }
    if (
      payload.idVerificationId
      && `${payload.idVerificationId}` !== `${performer.idVerificationId}`
    ) {
      performer.idVerificationId
        && (await this.fileService.remove(performer.idVerificationId));
    }
    if (
      payload.releaseFormId
      && `${payload.releaseFormId}` !== `${performer.releaseFormId}`
    ) {
      performer.releaseFormId
        && (await this.fileService.remove(performer.releaseFormId));
    }

    merge(performer, data);
    if (studioId) {
      await this.queueEventService.publish(
        new QueueEvent({
          channel: PERFORMER_CHANNEL,
          eventName: EVENT.UPDATED,
          data: {
            performer,
            oldStudioId: studioId
          }
        })
      );
    }

    await this.queueEventService.publish(
      new QueueEvent({
        channel: 'STUDIO_MEMBER_CHANNEL',
        eventName: EVENT.CREATED,
        data: { studioId: performer.studioId }
      })
    );

    return performer;
  }

  public async studioUpdateStatus(
    id: string,
    status: string,
    studioId: ObjectId
  ) {
    const performer = await this.findById(id);
    if (!performer) {
      throw new EntityNotFoundException();
    }

    if (performer.studioId.toString() !== studioId.toString()) {
      throw new ForbiddenException();
    }

    if (![STATUS.ACTIVE, STATUS.INACTIVE].includes(status)) {
      throw new BadRequestException();
    }

    return this.PerformerModel.updateOne(
      { _id: id },
      { $set: { status } },
      { new: true }
    );
  }

  public async update(
    id: string | ObjectId,
    payload: Partial<PerformerUpdatePayload>
  ): Promise<any> {
    const performer = await this.PerformerModel.findOne({ _id: id });
    if (!performer) {
      throw new EntityNotFoundException();
    }

    const data: Record<string, any> = { ...payload };
    // TODO - check roles here
    if (performer && `${performer._id}` !== `${id}`) {
      delete data.email;
      delete data.username;
    }
    if (payload.dateOfBirth) data.dateOfBirth = new Date(payload.dateOfBirth);

    const {
      avatarId,
      documentVerificationId,
      idVerificationId,
      releaseFormId
    } = performer;

    data.name = [performer.firstName || '', performer.lastName || '']
      .join(' ')
      .trim();

    data.isDark = payload.isDark;
    const badging = SettingService.getValueByKey(SETTING_KEYS.USER_BADGING);
    data.badgingTierToken = badging.find((r) => r.id === payload.badgingId)?.token || null;

    await this.PerformerModel.updateOne({ _id: id }, data);

    await Promise.all([
      payload.avatarId
      && this.fileService.addRef(payload.avatarId, {
        itemId: performer._id,
        itemType: 'performer-avatar'
      }),
      payload.documentVerificationId
      && this.fileService.addRef(payload.documentVerificationId, {
        itemId: performer._id,
        itemType: 'performer-document-verification'
      }),
      payload.releaseFormId
      && this.fileService.addRef(payload.releaseFormId, {
        itemId: performer._id,
        itemType: 'performer-release-form'
      }),
      payload.idVerificationId
      && this.fileService.addRef(payload.idVerificationId, {
        itemId: performer._id,
        itemType: 'performer-id-verification'
      })
    ]);

    await Promise.all([
      payload.avatarId
      && this.queueEventService.publish(
        new QueueEvent({
          channel: MEDIA_FILE_CHANNEL,
          eventName: FILE_EVENT.FILE_RELATED_MODULE_UPDATED,
          data: {
            type: DELETE_FILE_TYPE.FILEID,
            currentFile: avatarId,
            newFile: payload.avatarId
          }
        })
      ),
      payload.documentVerificationId
      && this.queueEventService.publish(
        new QueueEvent({
          channel: MEDIA_FILE_CHANNEL,
          eventName: FILE_EVENT.FILE_RELATED_MODULE_UPDATED,
          data: {
            type: DELETE_FILE_TYPE.FILEID,
            currentFile: documentVerificationId,
            newFile: payload.documentVerificationId
          }
        })
      ),
      payload.releaseFormId
      && this.queueEventService.publish(
        new QueueEvent({
          channel: MEDIA_FILE_CHANNEL,
          eventName: FILE_EVENT.FILE_RELATED_MODULE_UPDATED,
          data: {
            type: DELETE_FILE_TYPE.FILEID,
            currentFile: releaseFormId,
            newFile: payload.releaseFormId
          }
        })
      ),
      payload.idVerificationId
      && this.queueEventService.publish(
        new QueueEvent({
          channel: MEDIA_FILE_CHANNEL,
          eventName: FILE_EVENT.FILE_RELATED_MODULE_UPDATED,
          data: {
            type: DELETE_FILE_TYPE.FILEID,
            currentFile: idVerificationId,
            newFile: payload.idVerificationId
          }
        })
      )
    ]);
    return true;
  }

  public async viewProfile(id: string | ObjectId) {
    return this.PerformerModel.updateOne(
      { _id: id },
      {
        $inc: { 'stats.views': 1 }
      },
      { new: true }
    );
  }

  public async updateBlockSetting(
    performerId: ObjectId,
    payload: BlockSettingPayload
  ) {
    let item = await this.BlockSettingModel.findOne({
      performerId
    });
    if (item) {
      if (payload.countries) {
        item.countries = uniq([
          ...payload.countries
        ]);
      }
      if (payload.userIds) {
        item.userIds = uniq([
          ...(item.userIds || []),
          ...(payload.userIds || [])
        ]);
      }
      payload.userIds
        && (await this.queueEventService.publish({
          channel: BLOCK_USERS_CHANNEL,
          eventName: BLOCK_ACTION.CREATED,
          data: {
            userIds: payload.userIds,
            performerId: item.performerId
          }
        }));
      await item.save();
      return item;
    }

    // eslint-disable-next-line new-cap
    item = new this.BlockSettingModel();
    item.performerId = performerId;
    item.userIds = uniq(payload.userIds || []);
    item.countries = uniq(payload.countries || []);
    payload.userIds
      && (await this.queueEventService.publish({
        channel: BLOCK_USERS_CHANNEL,
        eventName: BLOCK_ACTION.CREATED,
        data: {
          userIds: item.userIds,
          performerId: item.performerId
        }
      }));
    await item.save();
    return item;
  }

  public async removeUserBlockedList(performerId, userId) {
    const item = await this.BlockSettingModel.findOne({
      performerId
    });
    if (!item) throw new EntityNotFoundException();
    await this.BlockSettingModel.updateOne({ _id: item._id }, {
      $pull: {
        userIds: userId
      }
    });
    return true;
  }

  public async getBlockSetting(performerId: ObjectId): Promise<BlockSettingDto> {
    const item = await this.BlockSettingModel.findOne({ performerId });
    if (!item) {
      const newData = await this.BlockSettingModel.create({
        performerId,
        userIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        countries: []
      });
      return plainToInstance(BlockSettingDto, newData.toObject());
    }
    const users = item.userIds?.length
      ? await this.userService.findByIds(item.userIds)
      : [];
    const data = plainToInstance(BlockSettingDto, item.toObject());
    data.usersInfo = users.length
      ? users.map((u) => u._id && u.toResponse(false))
      : [];
    return data;
  }

  public async checkBlock(performerId, countryCode, user): Promise<{ blocked: boolean }> {
    let isBlocked = false;
    const blockSettings = await this.BlockSettingModel.findOne({ performerId });

    if (countryCode && blockSettings) {
      isBlocked = await this.checkBlockedByIp(blockSettings, countryCode);
    }
    let isBlockedByPerformer = false;
    if (user && blockSettings) {
      isBlockedByPerformer = await this.checkBlockedByPerformer(
        blockSettings,
        user._id
      );
    }
    const blocked = !!(isBlockedByPerformer || isBlocked);
    return { blocked };
  }

  public async updateSteamingStatus(id: string | ObjectId, status: string) {
    return this.PerformerModel.updateOne(
      { _id: id },
      { $set: { streamingTitle: status } }
    );
  }

  public async updateLastStreamingTime(
    id: string | ObjectId,
    streamTime: number
  ) {
    const newEvent: QueueEvent = {
      channel: PERFORMER_STEAMING_STATUS_CHANNEL,
      eventName: OFFLINE,
      data: { id }
    };
    await this.queueEventService.publish(newEvent);
    return this.PerformerModel.updateOne(
      { _id: id },
      {
        $set: {
          lastStreamingTime: new Date(),
          live: false,
          streamingStatus: OFFLINE
        },
        $inc: { 'stats.totalStreamTime': streamTime }
      }
    );
  }

  public async offline(id: string | ObjectId) {
    const performer = await this.findById(id);
    if (!performer) {
      return;
    }

    await this.PerformerModel.updateOne(
      { _id: id },
      {
        $set: {
          isOnline: false,
          streamingStatus: OFFLINE,
          onlineAt: null,
          offlineAt: new Date()
        }
      }
    );
    await this.socketUserService.emitToConnectedUsers('modelUpdateStatus', {
      id,
      performer: new PerformerDto({
        ...performer,
        streamingStatus: OFFLINE
      }).toSearchResponse(),
      status: USER_SOCKET_EVENT.DISCONNECTED
    });
  }

  public async updateVerificationStatus(
    userId: string | ObjectId
  ): Promise<any> {
    return this.PerformerModel.updateOne(
      {
        _id: userId
      },
      { emailVerified: true },
      { new: true }
    );
  }

  public async increaseBalance(id: string | ObjectId, amount: number) {
    return this.PerformerModel.updateOne(
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

  public async updateBalance(id: string | ObjectId, balance) {
    await this.PerformerModel.updateOne({ _id: id }, {
      $set: {
        balance
      }
    });
  }

  public async updateStats(
    id: string | ObjectId,
    payload: Record<string, number>
  ) {
    return this.PerformerModel.updateOne({ _id: id }, { $inc: payload });
  }

  public async goLive(id: string | ObjectId) {
    return this.PerformerModel.updateOne({ _id: id }, { $set: { live: true } });
  }

  public async setStreamingStatus(
    id: string | ObjectId,
    streamingStatus: string
  ) {
    const performer = await this.PerformerModel.findOne({ _id: id });
    if (!performer) {
      return;
    }

    if (streamingStatus === performer.streamingStatus) {
      return;
    }

    const newEvent: QueueEvent = {
      channel: PERFORMER_STEAMING_STATUS_CHANNEL,
      eventName: streamingStatus,
      data: { id, oldStreamingStatus: performer.streamingStatus }
    };
    await this.queueEventService.publish(newEvent);
    await this.PerformerModel.updateOne(
      { _id: toObjectId(id) },
      { $set: { streamingStatus } }
    );
  }

  public async updateAvatar(
    performerId: ObjectId,
    file: FileDto
  ): Promise<FileDto> {
    const performer = await this.PerformerModel.findById(performerId);
    if (!performer) {
      await this.fileService.remove(file._id);
      throw new EntityNotFoundException();
    }

    const { avatarId } = performer;
    await this.PerformerModel.updateOne(
      { _id: performerId },
      {
        avatarId: file._id,
        avatarPath: file.path
      }
    );
    if (avatarId !== file._id) {
      await this.fileService.remove(avatarId);
    }
    return file;
  }

  public async updateDefaultPrice(
    id: ObjectId,
    payload: DefaultPricePayload
  ): Promise<any> {
    return this.PerformerModel.updateOne(
      { _id: id },
      {
        $set: {
          privateCallPrice: payload.privateCallPrice,
          groupCallPrice: payload.groupCallPrice,
          spinWheelPrice: payload.spinWheelPrice
        }
      }
    );
  }

  public async updateBroadcastSetting(
    id: string | ObjectId,
    payload: PerformerBroadcastSetting
  ) {
    return this.PerformerModel.updateOne({ _id: id }, payload);
  }

  public selfSuspendAccount(performerId: string | ObjectId) {
    return this.PerformerModel.updateOne(
      { _id: performerId },
      { status: PERFORMER_STATUSES.INACTIVE }
    );
  }

  public async stats() {
    const [
      totalVideos,
      totalPhotos,
      totalGalleries,
      totalProducts,
      totalStreamTime,
      totalTokenEarned
    ] = await Promise.all([
      this.PerformerModel.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: '$stats.totalVideos'
            }
          }
        }
      ]),
      this.PerformerModel.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: '$stats.totalPhotos'
            }
          }
        }
      ]),
      this.PerformerModel.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: '$stats.totalGalleries'
            }
          }
        }
      ]),
      this.PerformerModel.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: '$stats.totalProducts'
            }
          }
        }
      ]),
      this.PerformerModel.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: '$stats.totalStreamTime'
            }
          }
        }
      ]),
      this.PerformerModel.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: '$stats.totalTokenEarned'
            }
          }
        }
      ])
    ]);

    return {
      totalVideos: (totalVideos.length && totalVideos[0].total) || 0,
      totalPhotos: (totalPhotos.length && totalPhotos[0].total) || 0,
      totalGalleries: (totalGalleries.length && totalGalleries[0].total) || 0,
      totalProducts: (totalProducts.length && totalProducts[0].total) || 0,
      totalStreamTime:
        (totalStreamTime.length && totalStreamTime[0].total) || 0,
      totalTokenEarned:
        (totalTokenEarned.length && totalTokenEarned[0].total) || 0
    };
  }

  async totalOnlineTodayStat(studioId: string | ObjectId) {
    const totalOnlineToday = await this.PerformerModel.aggregate([
      {
        $match: {
          studioId,
          lastStreamingTime: {
            $gt: moment()
              .set({ hour: 0, minute: 0 })
              .toDate()
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 }
        }
      }
    ]);
    return (totalOnlineToday.length && totalOnlineToday[0].total) || 0;
  }

  async totalHoursOnlineStat(studioId: string | ObjectId) {
    const totalHoursOnline = await this.PerformerModel.aggregate([
      { $match: { studioId } },
      {
        $group: {
          _id: null,
          total: { $sum: '$stats.totalStreamTime' }
        }
      }
    ]);
    return (totalHoursOnline.length && totalHoursOnline[0].total) || 0;
  }

  public async checkAuthDocument(req: any, user: UserDto) {
    const { query } = req;
    if (!query.documentId) {
      return false;
    }

    const file = await this.fileService.findById(query.documentId);
    if (!file || !file.refItems || !file.refItems.length) {
      return false;
    }

    if (user.roles && user.roles.includes('admin')) {
      return true;
    }

    const { itemId } = file.refItems[0];
    if (user._id.toString() !== itemId.toString()) {
      return false;
    }

    if (
      file.type
      && [
        'performer-document',
        'company-registration-certificate',
        'performer-release-form'
      ].indexOf(file.type) !== -1
    ) {
      return true;
    }

    return false;
  }

  public async countByStatus(status: string) {
    return this.PerformerModel.countDocuments({ status });
  }

  public async getTotalStreamTime() {
    const totalStreamTime = await this.PerformerModel.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: '$stats.totalStreamTime'
          }
        }
      }
    ]);
    return (totalStreamTime && totalStreamTime.length && totalStreamTime[0].total) || 0;
  }

  private parseAgeRange(ageRange: string): [number, number] {
    const [min, max] = ageRange.split('-').map(Number);
    return [min, max];
  }

  public async getPerformersBasedOnUserPreferences(userId: ObjectId, req: PerformerSearchPayload) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const orConditions: any[] = [];

    if (user.agePreferences?.length) {
      const ageConditions = user.agePreferences.map((range) => {
        const [minAge, maxAge] = this.parseAgeRange(range);
        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - maxAge);
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() - minAge);

        return { dateOfBirth: { $gte: minDate, $lte: maxDate } };
      });
      orConditions.push({ $or: ageConditions });
    }

    if (user.genderPreferences?.length) {
      orConditions.push({ gender: { $in: user.genderPreferences } });
    }

    if (user.ethnicPreferences?.length) {
      orConditions.push({ ethnicity: { $in: user.ethnicPreferences } });
    }

    if (user.tagPreferences?.length) {
      orConditions.push({ tags: { $elemMatch: { $in: user.tagPreferences } } });
    }

    const query = orConditions.length ? { $or: orConditions } : {};

    // online status on top priority
    const sort = {
      isOnline: -1,
      onlineAt: -1
    } as any;

    const [performers, total] = await Promise.all([
      this.PerformerModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.PerformerModel.countDocuments(query)
    ]);

    return {
      data: performers.map((item) => new PerformerDto(item).toSearchResponse()),
      total
    };
  }

  public aggregate(pipeline: any) {
    return this.PerformerModel.aggregate(pipeline);
  }

  public async checkUserRank(performerId: string, userId: string) {
    const userRank = await this.userService.searchUserRank(performerId, userId);
    return userRank;
  }

  public async alertPerformerSignupToAdmin(performer: any, studio?: any) {
    const adminEmail = SettingService.getValueByKey(SETTING_KEYS.ADMIN_EMAIL);
    if (!adminEmail) {
      return;
    }
    const siteName = SettingService.getValueByKey(SETTING_KEYS.SITE_NAME) || process.env.DOMAIN || 'XXXChatNow';

    await this.mailerService.send({
      template: 'admin-model-signup-notification',
      to: adminEmail,
      subject: 'New Model Registration',
      data: {
        model: {
          name: performer.name || performer.username,
          email: performer.email,
          username: performer.username
        },
        studio: studio ? {
          name: studio.name || 'N/A'
        } : { name: 'N/A' },
        registrationDate: new Date().toLocaleDateString(),
        siteName
      }
    });
  }
}
