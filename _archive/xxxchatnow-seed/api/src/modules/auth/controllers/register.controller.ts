import {
  Post, HttpCode, HttpStatus, Body, Controller, Get, Res, Query, ValidationPipe, UsePipes
} from '@nestjs/common';
import { UserService } from 'src/modules/user/services';
import { DataResponse, QueueEvent, QueueEventService } from 'src/kernel';
import { SettingService } from 'src/modules/settings';
import { STATUS, ROLE_USER } from 'src/modules/user/constants';
import { Response } from 'express';
import { omit } from 'lodash';
import { EVENT, EXCLUDE_FIELDS } from 'src/kernel/constants';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { ReferralService } from 'src/modules/referral/services/referral.service';
import { REFERRAL_CHANNEL } from 'src/modules/referral/contants';
import { UserRegisterPayload } from '../payloads';
import { VerificationService, AuthService } from '../services';

@Controller('auth')
export class RegisterController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly verificationService: VerificationService,
    private readonly settingService: SettingService,
    private readonly referralService: ReferralService,
    private readonly queueEventService: QueueEventService
  ) {}

  @Post('users/register')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async userRegister(@Body() req: UserRegisterPayload): Promise<DataResponse<{ message: string }>> {
    const requireEmailVerification = SettingService.getValueByKey('requireEmailVerification');

    const user = await this.userService.create(omit(req, EXCLUDE_FIELDS), {
      status: requireEmailVerification ? STATUS.PENDING : STATUS.ACTIVE,
      roles: ROLE_USER,
      emailVerified: !requireEmailVerification
    });

    await this.authService.createAuthPassword({
      source: 'user',
      sourceId: user._id,
      value: req.password,
      key: req.email
    });
    // if require for email verification, we will send verification email
    requireEmailVerification && (await this.verificationService.sendVerificationEmail(user._id, user.email, 'user'));
    if (req.rel) {
      await this.referralService.newReferral({

        registerSource: 'user',

        registerId: user._id,

        code: req.rel

      });
      const referral = await this.referralService.findOne({ registerId: user._id.toString() });

      await this.queueEventService.publish(
        new QueueEvent({
          channel: REFERRAL_CHANNEL,
          eventName: EVENT.CREATED,
          data: {
            referral,
            memberRoles: 'user'
          }
        })
      );
    }

    return DataResponse.ok({
      message: requireEmailVerification
        ? 'We have sent an email to verify your email, please check your inbox.'
        : 'Your register has been successfully.'
    });
  }

  @Get('email-verification')
  public async verifyEmail(@Res() res: Response, @Query('token') token: string) {
    if (!token) {
      return res.render('404.html');
    }

    await this.verificationService.verifyEmail(token);
    const [emailVerificationSuccessUrl, userUrl] = await Promise.all([
      this.settingService.getKeyValue(SETTING_KEYS.EMAIL_VERIFICATION_SUCCESS_URL),
      this.settingService.getKeyValue(SETTING_KEYS.USER_URL)
    ]);
    return res.redirect(emailVerificationSuccessUrl || userUrl || process.env.USER_URL);
  }
}
