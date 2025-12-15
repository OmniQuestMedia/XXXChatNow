import {
  Post,
  HttpCode,
  HttpStatus,
  Body,
  Controller,
  ValidationPipe,
  UsePipes,
  UseInterceptors
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { SettingService } from 'src/modules/settings';
import { StudioService } from 'src/modules/studio/services';
import { STUDIO_STATUES } from 'src/modules/studio/constants';
import { isEmail } from 'src/kernel/helpers/string.helper';
import { RecaptchaValidateInterceptor } from 'src/modules/utils/interceptors';
import {
  EmailOrPasswordIncorrectException,
  EmailNotVerifiedException,
  AccountInactiveException,
  AccountNotFoundxception,
  AccountPendingException
} from '../exceptions';
import { LoginPayload } from '../payloads';
import { AuthService } from '../services';

@Controller('auth/studio')
export class StudioLoginController {
  constructor(
    private readonly studoService: StudioService,
    private readonly authService: AuthService
  ) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @UseInterceptors(RecaptchaValidateInterceptor)
  public async loginByEmail(
    @Body() req: LoginPayload
  ): Promise<DataResponse<{ token: string }>> {
    const username = req.username.toLowerCase();
    const query = [{ username }] as any[];
    if (isEmail(username)) query.push({ email: username });
    const studio = await this.studoService.findOne({
      $or: query
    });
    if (!studio) throw new EmailOrPasswordIncorrectException();

    const auth = await this.authService.findBySource({
      type: 'password',
      sourceId: studio._id
    });
    if (!auth) throw new AccountNotFoundxception();
    if (!this.authService.verifyPassword(req.password, auth)) throw new EmailOrPasswordIncorrectException();

    if (SettingService.getValueByKey('requireEmailVerification') && !studio.emailVerified) throw new EmailNotVerifiedException();

    if (studio.status === STUDIO_STATUES.PENDING) throw new AccountPendingException();
    else if (studio.status === STUDIO_STATUES.INACTIVE) throw new AccountInactiveException();

    return DataResponse.ok({
      token: this.authService.generateJWT(auth, {
        expiresIn: req.remember ? 60 * 60 * 365 : 60 * 60 * 24
      })
    });
  }
}
