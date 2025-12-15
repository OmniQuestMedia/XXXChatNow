import {
  Post, HttpCode, HttpStatus, Body, Controller, ValidationPipe, UsePipes, UseInterceptors,
  UseGuards,
  HttpException
} from '@nestjs/common';
import { UserService } from 'src/modules/user/services';
import { DataResponse } from 'src/kernel';
import { SettingService } from 'src/modules/settings';
import { STATUS_PENDING, STATUS_INACTIVE } from 'src/modules/user/constants';
import { isEmail } from 'src/kernel/helpers/string.helper';
import { RecaptchaValidateInterceptor } from 'src/modules/utils/interceptors';
import { UserDto } from 'src/modules/user/dtos';
import { LoginPayload } from '../payloads';
import { AuthService } from '../services';
import {
  EmailOrPasswordIncorrectException,
  EmailNotVerifiedException,
  AccountInactiveException
} from '../exceptions';
import { AuthGuard } from '../guards';
import { CurrentUser } from '../decorators';

@Controller('auth')
export class LoginController {
  constructor(private readonly userService: UserService, private readonly authService: AuthService) { }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @UseInterceptors(RecaptchaValidateInterceptor)
  public async loginByEmail(@Body() req: LoginPayload): Promise<DataResponse<any>> {
    const username = req.username.toLowerCase();
    const query = [{ username }] as any[];
    if (isEmail(username)) query.push({ email: username });
    const user = await this.userService.findOne({
      $or: query
    });
    if (!user) throw new EmailOrPasswordIncorrectException();

    const auth = await this.authService.findBySource({
      sourceId: user._id
    });
    if (!auth) throw new EmailOrPasswordIncorrectException();

    if (!this.authService.verifyPassword(req.password, auth)) throw new EmailOrPasswordIncorrectException();

    if (user.isTwoFactorAuthenticationEnabled) {
      return DataResponse.ok({ id: user._id, remember: req.remember, isTwoFactorAuthenticationEnabled: user.isTwoFactorAuthenticationEnabled });
    }

    if (SettingService.getValueByKey('requireEmailVerification') && !user.emailVerified) {
      throw new EmailNotVerifiedException();
    }

    // if (user.status === STATUS_PENDING) {
    //   throw new AccountPendingException();
    // }
    if (user.status === STATUS_INACTIVE || user.status === STATUS_PENDING) {
      throw new AccountInactiveException();
    }

    return DataResponse.ok({
      token: this.authService.generateJWT(auth, {
        expiresIn: req.remember ? 60 * 60 * 365 : 60 * 60 * 24
      })
    });
  }

  @Post('users/login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @UseInterceptors(RecaptchaValidateInterceptor)
  public async userLogin(@Body() req: LoginPayload): Promise<DataResponse<{ token: string }>> {
    const username = req.username.toLowerCase();
    const query = [{ username }] as any[];
    if (isEmail(username)) query.push({ email: username });
    const user = await this.userService.findOne({
      $or: query
    });
    if (!user) throw new EmailOrPasswordIncorrectException();

    const auth = await this.authService.findBySource({
      sourceId: user._id
    });
    if (!auth) throw new EmailOrPasswordIncorrectException();

    if (!this.authService.verifyPassword(req.password, auth)) throw new EmailOrPasswordIncorrectException();

    if (SettingService.getValueByKey('requireEmailVerification') && !user.emailVerified) {
      throw new EmailNotVerifiedException();
    }

    // if (user.status === STATUS_PENDING) {
    //   throw new AccountPendingException();
    // }
    if (user.status === STATUS_INACTIVE || user.status === STATUS_PENDING) {
      throw new AccountInactiveException();
    }

    return DataResponse.ok({
      token: this.authService.generateJWT(auth, {
        expiresIn: req.remember ? 60 * 60 * 365 : 60 * 60 * 24
      })
    });
  }

  @Post('/2fa/authenticate')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({
    transform: true,
    whitelist: true
  }))
  public async authenticator(
    @Body() payload: any
  ) {
    const user = await this.userService.findById(payload.id);

    const isCodeValid = await this.userService.isTwoFactorAuthenticationCodeValid(
      payload.twoFactorAuthenticationCode,
      user
    );

    if (!isCodeValid) {
      throw new HttpException('Wrong authentication code', 400);
    }

    const authPassword = await this.authService.findBySource({
      sourceId: user._id,
      type: 'password'
    });

    const token = payload.remember ? this.authService.generateJWT(authPassword, { expiresIn: 60 * 60 * 24 * 365 }) : this.authService.generateJWT(authPassword, { expiresIn: 60 * 60 * 24 * 1 });
    return DataResponse.ok({ token });
  }

  @Post('/2fa/generateQR')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({
    transform: true,
    whitelist: true
  }))
  public async generateQR(
    @CurrentUser() user: UserDto
  ) {
    const { otpAuthUrl } = await this.authService.generateTwoFactorAuthenticationSecret(user);
    const qr = await this.userService.generateQrCodeDataURL(otpAuthUrl);
    return DataResponse.ok(qr);
  }
}
