import {
  Post, HttpCode, HttpStatus, Body, Controller, UsePipes, ValidationPipe, UseInterceptors
} from '@nestjs/common';
import { DataResponse, EntityNotFoundException } from 'src/kernel';
import { PerformerService } from 'src/modules/performer/services';
import { PERFORMER_STATUSES } from 'src/modules/performer/constants';
import { SettingService } from 'src/modules/settings';
import { isEmail } from 'src/kernel/helpers/string.helper';
import { RecaptchaValidateInterceptor } from 'src/modules/utils/interceptors';
import {
  EmailNotVerifiedException,
  UsernameOrPasswordIncorrectException,
  AccountInactiveException,
  AccountPendingException
} from '../exceptions';
import { LoginPayload } from '../payloads';
import { AuthService } from '../services';

@Controller('auth')
export class PerformerLoginController {
  constructor(
    private readonly performerService: PerformerService,
    private readonly authService: AuthService
  ) { }

  @Post('performers/login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @UseInterceptors(RecaptchaValidateInterceptor)
  public async loginByUsername(
    @Body() req: LoginPayload
  ): Promise<DataResponse<{ token: string }>> {
    const username = req.username.toLowerCase();
    const query = [{ username }] as any[];
    if (isEmail(username)) query.push({ email: username });
    const performer = await this.performerService.findOne({
      $or: query
    });
    if (!performer) {
      throw new EntityNotFoundException();
    }

    const auth = await this.authService.findBySource({
      sourceId: performer._id
    });
    if (!auth) throw new UsernameOrPasswordIncorrectException();
    if (!this.authService.verifyPassword(req.password, auth)) throw new UsernameOrPasswordIncorrectException();

    if (
      SettingService.getValueByKey('requireEmailVerification')
      && !performer.emailVerified
    ) {
      throw new EmailNotVerifiedException();
    }

    if (performer.status === PERFORMER_STATUSES.PENDING) throw new AccountPendingException();
    else if (performer.status === PERFORMER_STATUSES.INACTIVE) throw new AccountInactiveException();

    return DataResponse.ok({
      token: this.authService.generateJWT(auth, {
        expiresIn: req.remember ? 60 * 60 * 365 : 60 * 60 * 24
      })
    });
  }
}
