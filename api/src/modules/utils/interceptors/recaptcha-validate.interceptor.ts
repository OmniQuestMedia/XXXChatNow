import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException
} from '@nestjs/common';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { Request } from 'express';
import { RecaptchaService } from '../services';

@Injectable()
export class RecaptchaValidateInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const ctx = context.switchToHttp();
    const {
      body, headers, connection, path
    } = ctx.getRequest<Request>();

    if (path === '/auth/admin/login') {
      return next.handle();
    }

    const recaptchaEnable = SettingService.getValueByKey(SETTING_KEYS.GOOGLE_RECAPTCHA_ENABLED_KEY);
    if (!recaptchaEnable) return next.handle();

    if (!body.recaptchaValue) {
      throw new HttpException('Please verify recaptcha', 400);
    }

    let ipClient = headers['x-forwarded-for'] || connection.remoteAddress;
    ipClient = Array.isArray(ipClient) ? ipClient.toString() : ipClient;
    if (ipClient.substr(0, 7) === '::ffff:') {
      ipClient = ipClient.substr(7);
    }

    await RecaptchaService.verifyGoogleRecaptcha(body.recaptchaValue, ipClient);

    return next.handle();
  }
}
