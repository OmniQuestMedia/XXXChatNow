import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { PerformerDto } from 'src/modules/performer/dtos';
import { UserService } from 'src/modules/user/services';
import { PerformerService } from 'src/modules/performer/services';
import { StringHelper, EntityNotFoundException } from 'src/kernel';
import { MailerService } from 'src/modules/mailer';
import { ConfigService } from 'nestjs-config';
import { StudioService } from 'src/modules/studio/services';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { SettingService } from 'src/modules/settings';
import { authenticator } from 'otplib';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { AuthDto, ForgotDto } from '../dtos';
import { AuthErrorException } from '../exceptions';
import { Auth, Forgot } from '../schemas';
import { IAuthPayload } from '../interfaces';
import { AuthPayload } from '../payloads';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Auth.name) private readonly AuthModel: Model<Auth>,
    @InjectModel(Forgot.name) private readonly ForgotModel: Model<Forgot>,
    private readonly userService: UserService,
    private readonly performerService: PerformerService,
    private readonly mailService: MailerService,
    private readonly config: ConfigService,
    private readonly studioService: StudioService
  ) { }

  /**
   * generate password salt
   * @param byteSize integer
   */
  public generateSalt(byteSize = 16): string {
    return crypto.randomBytes(byteSize).toString('base64');
  }

  public encryptPassword(pw: string, salt: string): string {
    const defaultIterations = 10000;
    const defaultKeyLength = 64;

    return crypto
      .pbkdf2Sync(pw, salt, defaultIterations, defaultKeyLength, 'sha1')
      .toString('base64');
  }

  public async createAuthPassword(data: AuthPayload): Promise<AuthDto> {
    const salt = this.generateSalt();
    const newVal = this.encryptPassword(data.value, salt);

    await this.AuthModel.deleteMany({
      type: 'password',
      sourceId: data.sourceId
    });

    // avoid admin update
    // TODO - should listen via user event?
    const auth = await this.AuthModel.create({
      type: 'password',
      source: data.source,
      sourceId: data.sourceId,
      salt,
      value: newVal,
      key: data.key
    });
    return plainToInstance(AuthDto, auth.toObject());
  }

  public async changeNewKey(sourceId, type, newKey) {
    const auth = await this.AuthModel.findOne({
      type,
      sourceId
    });
    if (!auth) return null;
    auth.key = newKey;
    return auth.save();
  }

  public async updateAuthPassword(data: AuthDto) {
    let user: any;
    switch (data.source) {
      case 'user':
        user = await this.userService.findById(data.sourceId);
        break;
      case 'studio':
        user = await this.studioService.findById(data.sourceId);
        break;
      case 'performer':
        user = await this.performerService.findById(data.sourceId);
        break;
      default:
        break;
    }
    if (!user) {
      throw new EntityNotFoundException();
    }

    await this.createAuthPassword({
      source: data.source,
      sourceId: data.sourceId,
      key: user.email.toLowerCase(),
      value: data.value
    });

    if (user.email) {
      await this.mailService.send({
        subject: 'Password has been changed',
        template: 'update-new-password',
        to: user.email,
        data: {
          username: user.username,
          password: data.value
        }
      });
    }

    return true;
  }

  public async findBySource({ sourceId, type = 'password' }: {
    sourceId?: ObjectId;
    type?: string;
    key?: string;
  }): Promise<AuthDto | null> {
    const auth = await this.AuthModel.findOne({
      sourceId,
      type
    });
    if (!auth) return null;
    return plainToInstance(AuthDto, auth.toObject());
  }

  public async findByEmail(email: string, source: string) {
    return this.AuthModel.findOne({
      key: email.toLocaleLowerCase().toString(),
      source
    });
  }

  public verifyPassword(pw: string, auth: AuthDto): boolean {
    return this.encryptPassword(pw, auth.salt) === auth.value;
  }

  public generateJWT(auth: any, options: any = {}): string {
    const newOptions = {
      expiresIn: 60 * 60 * 24,
      ...options || {}
    };
    return jwt.sign(
      {
        authId: auth._id,
        source: auth.source,
        sourceId: auth.sourceId
      },
      process.env.TOKEN_SECRET,
      {
        expiresIn: newOptions.expiresIn
      }
    );
  }

  public verifyJWT(token: string): IAuthPayload | false {
    try {
      return jwt.verify(token, process.env.TOKEN_SECRET) as IAuthPayload;
    } catch (e) {
      return false;
    }
  }

  public decodeJWT(token: string): IAuthPayload | false {
    try {
      const decoded = jwt.decode(token, { complete: true });
      return decoded.payload as IAuthPayload;
    } catch (e) {
      return false;
    }
  }

  public async getSourceFromJWT(jwtToken: string | string[]): Promise<any> {
    // TODO - check and move to user service?
    const decodded = this.verifyJWT(jwtToken as string);
    if (!decodded) {
      throw new AuthErrorException();
    }

    switch (decodded.source) {
      case 'user': return this.userService.findById(decodded.sourceId);
      case 'performer': {
        const user = await this.performerService.findById(decodded.sourceId);

        // TODO - check activated status here
        // TODO - check me when respond DTO only
        if (user) {
          user.isPerformer = true;
        }
        return new PerformerDto(user);
      }
      case 'studio': return this.studioService.findById(decodded.sourceId);
      default: return null;
    }
  }

  public async forgot(
    auth: AuthDto,
    source: {
      _id: ObjectId;
      email: string;
    }
  ) {
    const token = StringHelper.randomString(14);
    await this.ForgotModel.create({
      token,
      source: auth.source,
      sourceId: source._id,
      authId: auth._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const forgotLink = new URL(
      `auth/password-change?token=${token}`,
      this.config.get('app.baseUrl')
    ).href;

    await this.mailService.send({
      subject: 'Recover password',
      to: source.email,
      data: {
        forgotLink
      },
      template: 'forgot'
    });
    return true;
  }

  public async getForgotByToken(token: string): Promise<ForgotDto> {
    const forgot = await this.ForgotModel.findOne({ token });
    if (!forgot) return null;
    return plainToInstance(ForgotDto, forgot.toObject());
  }

  public async deleteForgotBySourceId(sourceId) {
    await this.ForgotModel.deleteMany({
      sourceId
    });
  }

  public async deleteForgotById(id) {
    await this.ForgotModel.deleteOne({
      _id: id
    });
  }

  public async generateTwoFactorAuthenticationSecret(user: any) {
    const secret = authenticator.generateSecret();
    const siteName = await SettingService.getValueByKey(SETTING_KEYS.SITE_NAME) || process.env.DOMAIN;
    const otpAuthUrl = authenticator.keyuri(user.email, siteName, secret);
    await this.userService.setTwoFactorAuthenticationSecret(secret, user._id);
    return {
      secret,
      otpAuthUrl
    };
  }
}
