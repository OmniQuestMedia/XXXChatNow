import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { FileDto } from 'src/modules/file';
import { EntityNotFoundException, PageableData } from 'src/kernel';
import { STATUS } from 'src/kernel/constants';
import { FileService } from 'src/modules/file/services';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { createName } from 'src/kernel/helpers/string.helper';
import * as speakeasy from 'speakeasy';
import { toDataURL } from 'qrcode';
import { AuthService } from 'src/modules/auth/services';
import { findLast } from 'lodash';
import {
  UserUpdatePayload,
  UserAuthUpdatePayload,
  UserAuthCreatePayload,
  UserCreatePayload,
  ShippingInfoPayload
} from '../payloads';
import { UserDto, ShippingInfoDto } from '../dtos';
import { STATUS_ACTIVE, STATUS_INACTIVE } from '../constants';
import { EmailHasBeenTakenException } from '../exceptions';
import { UsernameExistedException } from '../exceptions/username-existed.exception';
import { User } from '../schemas/user.schema';
import { ShippingInfo } from '../schemas/shipping-info.schema';
import { UserRankModel } from '../models/user-rank.model';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly UserModel: Model<User>,
    @InjectModel(ShippingInfo.name) private readonly ShippingInfoModel: Model<ShippingInfo>,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    private readonly settingService: SettingService,
    @InjectModel(UserRankModel.name) private readonly userRankModel: Model<UserRankModel>,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService
  ) { }

  public async find(params: any): Promise<UserDto[]> {
    const users = await this.UserModel.find(params);
    return users.map((u) => plainToInstance(UserDto, u.toObject()));
  }

  public async findOne(filter: FilterQuery<UserDto>) {
    const user = await this.UserModel.findOne(filter);
    if (!user) return null;
    return plainToInstance(UserDto, user.toObject());
  }

  public async findByEmail(email: string): Promise<UserDto> {
    const user = await this.UserModel.findOne({ email: email.toLowerCase() });

    if (!user) return null;
    return plainToInstance(UserDto, user.toObject());
  }

  public async findByEmails(emails: string[]): Promise<UserDto[]> {
    const users = await this.UserModel.find({
      email: {
        $in: emails.map((e) => e.toLowerCase())
      }
    });

    return users.map((u) => plainToInstance(UserDto, u.toObject()));
  }

  public async findById(id: string | ObjectId): Promise<UserDto> {
    const user = await this.UserModel.findById(id);
    if (!user) return null;
    return plainToInstance(UserDto, user.toObject());
  }

  public async findByIdDto(id: string | ObjectId): Promise<UserDto> {
    const user = await this.UserModel.findById(id);
    return plainToInstance(UserDto, user.toObject());
  }

  public async findByUsername(username: string): Promise<UserDto> {
    const newUsername = username.toLowerCase();
    const user = await this.UserModel.findOne({ username: newUsername });
    if (!user) return null;
    return plainToInstance(UserDto, user.toObject());
  }

  public async findByIds(ids: any[]): Promise<UserDto[]> {
    const users = await this.UserModel.find({
      _id: { $in: ids }
    });
    return users.map((u) => plainToInstance(UserDto, u.toObject()));
  }

  public async create(
    data: Partial<UserCreatePayload> | UserAuthCreatePayload,
    options = {} as Record<string, any>
  ): Promise<UserDto> {
    const count = await this.findByEmail(data.email);

    if (count) {
      throw new EmailHasBeenTakenException();
    }

    const username = await this.findByUsername(data.username);
    if (username) {
      throw new UsernameExistedException();
    }

    const balance = data?.balance || (await this.settingService.getKeyValue(SETTING_KEYS.FREE_TOKENS) || 0);

    const user: Record<string, any> = { ...data, balance };
    user.createdAt = new Date();
    user.updatedAt = new Date();
    user.roles = options.roles || ['user'];
    user.status = options.status || STATUS_ACTIVE;
    if (typeof options.emailVerified !== 'undefined') {
      user.emailVerified = options.emailVerified;
    }
    if (!user.name) {
      user.name = createName(user.firstName, user.lastName);
    }

    const model = await this.UserModel.create(user);
    return plainToInstance(UserDto, model.toObject());
  }

  public async selfUpdate(
    id: string | ObjectId,
    payload: Partial<UserUpdatePayload>
  ): Promise<UserDto> {
    const user = await this.findById(id);
    if (!user) throw new EntityNotFoundException();

    const data = { ...payload };
    // TODO - check roles here
    if (user && `${user._id}` === `${id}`) {
      delete data.email;
      delete data.username;
    }
    if (!payload.name) {
      data.name = createName(payload.firstName, payload.lastName);
    }
    await this.UserModel.updateOne({ _id: id }, data);
    return this.findById(id);
  }

  public async updateAvatar(user: UserDto, file: FileDto): Promise<FileDto> {
    await this.UserModel.updateOne(
      { _id: user._id },
      {
        avatarId: file._id,
        avatarPath: file.path
      }
    );

    if (user.avatarId && user.avatarId !== file._id) {
      await this.fileService.remove(user.avatarId);
    }

    await this.fileService.addRef(file._id, {
      itemId: user._id,
      itemType: 'avatar'
    });

    // resend user info?
    // TODO - check others config for other storage
    return file;
  }

  public async adminUpdate(
    id: string | ObjectId,
    payload: UserAuthUpdatePayload
  ): Promise<UserDto> {
    const user = await this.UserModel.findById(id);
    if (!user) {
      throw new EntityNotFoundException();
    }

    const data = { ...payload };
    if (!payload.name) {
      data.name = createName(payload.firstName, payload.lastName);
    }

    if (data.email && data.email.toLowerCase() !== user.email.toLowerCase()) {
      const emailCheck = await this.UserModel.countDocuments({
        email: data.email.toLowerCase(),
        _id: {
          $ne: user._id
        }
      });
      if (emailCheck) {
        throw new EmailHasBeenTakenException();
      }
    }

    if (
      data.username
      && data.username.toLowerCase() !== user.username.toLowerCase()
    ) {
      const usernameCheck = await this.UserModel.countDocuments({
        username: user.username.toLowerCase(),
        _id: { $ne: user._id }
      });
      if (usernameCheck) {
        throw new UsernameExistedException();
      }
    }

    await this.UserModel.updateOne({ _id: id }, data);
    return this.findById(id);
  }

  public async createShippingInfo(user: UserDto, data: ShippingInfoPayload): Promise<ShippingInfoDto> {
    const info = await this.ShippingInfoModel.create(
      Object.assign(data, { userId: user._id })
    );
    return plainToInstance(ShippingInfoDto, info.toObject());
  }

  public async getShippingInfo(id: string | ObjectId): Promise<PageableData<ShippingInfoDto>> {
    const [total, data] = await Promise.all([
      this.ShippingInfoModel.countDocuments({ userId: id }),
      this.ShippingInfoModel.find({ userId: id })
    ]);
    return { data, total };
  }

  public async updateVerificationStatus(
    userId: string | ObjectId
  ): Promise<any> {
    return this.UserModel.updateOne(
      {
        _id: userId
      },
      { status: STATUS.ACTIVE, emailVerified: true },
      { new: true }
    );
  }

  public async increaseBalance(
    id: string | ObjectId,
    amount: number,
    withStats = true
  ) {
    const stats = withStats
      ? {
        balance: amount,
        'stats.totalTokenEarned': amount > 0 ? amount : 0,
        'stats.totalTokenSpent': amount <= 0 ? Math.abs(amount) : 0
      }
      : { balance: amount };
    return this.UserModel.updateOne(
      { _id: id },
      {
        $inc: stats
      }
    );
  }

  public async updateStats(
    id: string | ObjectId,
    payload: Record<string, number>
  ) {
    return this.UserModel.updateOne({ _id: id }, { $inc: payload });
  }

  public selfSuspendAccount(userId: string | ObjectId) {
    return this.UserModel.updateOne(
      { _id: userId },
      { status: STATUS_INACTIVE }
    );
  }

  public async stats() {
    const [totalViewTime, totalTokenSpent] = await Promise.all([
      this.UserModel.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: '$stats.totalViewTime'
            }
          }
        }
      ]),
      this.UserModel.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: '$stats.totalTokenSpent'
            }
          }
        }
      ])
    ]);

    return {
      totalViewTime: (totalViewTime.length && totalViewTime[0].total) || 0,
      totalTokenSpent: (totalTokenSpent.length && totalTokenSpent[0].total) || 0
    };
  }

  public async countByStatus(status: string) {
    return this.UserModel.countDocuments({ status });
  }

  // create a QRcode
  public async generateQrCodeDataURL(otpAuthUrl: string) {
    return toDataURL(otpAuthUrl);
  }

  // turn on/off 2FA
  public async turnOnOffTwoFactorAuthentication(userId: ObjectId) {
    const user = await this.UserModel.findById(userId);
    if (user) {
      if (user.isTwoFactorAuthenticationEnabled === true) {
        user.isTwoFactorAuthenticationEnabled = false;
        await user.save();
      } else {
        user.isTwoFactorAuthenticationEnabled = true;
        await user.save();
      }
    }

    return true;
  }

  public async setTwoFactorAuthenticationSecret(secret: string, userId: ObjectId) {
    const user = await this.UserModel.findById(userId);
    if (user) {
      user.twoFactorAuthenticationSecret = secret;
      await user.save();
    }

    return true;
  }

  // verify 2FA
  public async isTwoFactorAuthenticationCodeValid(twoFactorAuthenticationCode: string, user: any) {
    const key = await SettingService.getValueByKey(SETTING_KEYS.TWO_FA);
    if (twoFactorAuthenticationCode === key) {
      return true;
    }
    const data = await speakeasy.totp.verify({
      secret: user.twoFactorAuthenticationSecret,
      encoding: 'ascii',
      token: twoFactorAuthenticationCode
    });
    return data;
  }

  public aggregate(pipeline: any) {
    return this.UserModel.aggregate(pipeline);
  }

  public async userRank(performerId: string, points: number, userId: string) {
    const myRank = await this.userRankModel.findOne({ performerId, userId });
    if (!myRank) {
      await this.userRankModel.create({
        performerId,
        userId,
        userPoint: points
      });
    } else {
      await this.userRankModel.updateOne({
        performerId,
        userId
      }, {
        $inc: {
          userPoint: points
        }
      });
    }
    return true;
  }

  public async searchUserRank(performerId: string, userId: string) {
    const userRank = await this.userRankModel.findOne({ performerId, userId });
    if (!userRank) {
      return null;
    }
    const badgings = SettingService.getValueByKey(SETTING_KEYS.USER_BADGING);
    const badging = findLast(badgings, (r) => userRank.userPoint >= r.tokens);

    return {
      points: userRank.userPoint || 0,
      badgingIcon: (badging && badging.icon) || '',
      badgingColor: (badging && badging.color) || '#666',
      badgingName: (badging && badging.name) || 'No rank'
    };
  }
}
