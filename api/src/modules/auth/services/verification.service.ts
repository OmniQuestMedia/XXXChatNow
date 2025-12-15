import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { StringHelper, EntityNotFoundException } from 'src/kernel';
import { MailerService } from 'src/modules/mailer';
import { ConfigService } from 'nestjs-config';
import { UserService } from 'src/modules/user/services';
import { PerformerService } from 'src/modules/performer/services';
import { StudioService } from 'src/modules/studio/services';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { InjectModel } from '@nestjs/mongoose';
import { Verification } from '../schemas';

@Injectable()
export class VerificationService {
  constructor(
    @InjectModel(Verification.name) private readonly VerificationModel: Model<Verification>,
    private readonly mailService: MailerService,
    private readonly config: ConfigService,
    private readonly userService: UserService,
    private readonly performerService: PerformerService,
    private readonly studioService: StudioService,
    private readonly settingService: SettingService
  ) {}

  async sendVerificationEmail(sourceId: string | ObjectId, email: string, sourceType: string, options?: any): Promise<void> {
    let verification = await this.VerificationModel.findOne({
      sourceId,
      value: email
    });
    if (!verification) {
      verification = new this.VerificationModel();
    }

    const token = StringHelper.randomString(15);
    verification.set('sourceId', sourceId);
    verification.set('sourceType', sourceType);
    verification.set('value', email);
    verification.set('token', token);
    await verification.save();

    const siteName = await this.settingService.getKeyValue(SETTING_KEYS.SITE_NAME);
    const verificationLink = new URL(
      `auth/email-verification?token=${token}`,
      this.config.get('app.baseUrl')
    ).href;

    await this.mailService.send({
      to: email,
      subject: 'Verify your email address',
      data: {
        siteName,
        verificationLink,
        ...(options?.data || {})
      },
      template: options?.template || 'email-verification'
    });
  }

  async verifyEmail(token: string): Promise<void> {
    const verification = await this.VerificationModel.findOne({
      token,
      verified: false
    });
    if (!verification) {
      throw new EntityNotFoundException();
    }
    verification.verified = true;
    await verification.save();
    switch (verification.sourceType) {
      case 'user': {
        const user = await this.userService.findById(verification.sourceId);

        if (!user) throw new EntityNotFoundException();
        if (user.status === 'inactive') return;

        await this.userService.updateVerificationStatus(verification.sourceId);
        break;
      }
      case 'performer': {
        const performer = await this.performerService.findById(verification.sourceId);

        if (!performer) throw new EntityNotFoundException();
        if (performer.status === 'inactive') return;

        await this.performerService.updateVerificationStatus(verification.sourceId);
        break;
      }
      case 'studio': {
        const studio = await this.studioService.findById(verification.sourceId);

        if (!studio) throw new EntityNotFoundException();
        if (studio.status === 'inactive') return;

        await this.studioService.updateVerificationStatus(verification.sourceId);
        break;
      }
      default:
        break;
    }
  }
}
