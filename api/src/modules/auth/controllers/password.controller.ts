import {
  Post,
  HttpCode,
  HttpStatus,
  Body,
  Controller,
  Put,
  UseGuards,
  Get,
  Res,
  Query,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import { Response } from 'express';
import * as moment from 'moment';
import { UserService } from 'src/modules/user/services';
import { PerformerService } from 'src/modules/performer/services';
import { StudioService } from 'src/modules/studio/services';
import { UserDto } from 'src/modules/user/dtos';
import { DataResponse } from 'src/kernel';
import { plainToInstance } from 'class-transformer';
import { AuthService } from '../services';
import { AuthGuard, RoleGuard } from '../guards';
import { CurrentUser, Roles } from '../decorators';
import { PasswordChangePayload, PasswordUserChangePayload, ForgotPayload } from '../payloads';
import { AccountNotFoundxception, PasswordIncorrectException } from '../exceptions';
import { AuthDto } from '../dtos';

@Controller('auth')
export class PasswordController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly performerService: PerformerService,
    private readonly studioService: StudioService
  ) { }

  @Put('users/me/password')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  public async updatePassword(
    @CurrentUser() user: UserDto,
    @Body() payload: PasswordChangePayload
  ): Promise<DataResponse<boolean>> {
    const auth = await this.authService.findBySource({
      sourceId: user._id,
      type: 'password'
    });
    if (!auth) {
      throw new AccountNotFoundxception();
    }
    if (!this.authService.verifyPassword(payload.prePassword, auth)) {
      throw new PasswordIncorrectException();
    }

    await this.authService.updateAuthPassword(plainToInstance(AuthDto, {
      source: payload.source || 'user',
      sourceId: user._id,
      value: payload.password
    }));
    return DataResponse.ok(true);
  }

  @Put('users/password')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  public async updateUserPassword(
    @Body() payload: PasswordUserChangePayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<boolean>> {
    await this.authService.updateAuthPassword(plainToInstance(AuthDto, {
      source: payload.source || 'user',
      sourceId: payload.userId as any || user._id,
      value: payload.password
    }));
    return DataResponse.ok(true);
  }

  @Post('users/forgot')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  public async forgotPassword(
    @Body() req: ForgotPayload
  ): Promise<DataResponse<{ success: boolean }>> {
    let user = null;
    switch (req.type) {
      case 'user':
        user = await this.userService.findByEmail(req.email);
        break;
      case 'performer':
        user = await this.performerService.findByEmail(req.email);
        break;
      case 'studio':
        user = await this.studioService.findByEmail(req.email);
        break;
      default: break;
    }
    if (!user) {
      // dont show error, avoid email fetching
      throw new AccountNotFoundxception();
    }
    const auth = await this.authService.findBySource({
      sourceId: user._id,
      type: 'password'
    });
    if (!auth) {
      throw new AccountNotFoundxception();
    }

    // TODO - should query from auth?
    await this.authService.forgot(auth, {
      _id: user._id,
      email: user.email
    });

    return DataResponse.ok({
      success: true
    });
  }

  @Get('password-change')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  public async renderUpdatePassword(
    @Res() res: Response,
    @Query('token') token: string
  ) {
    if (!token) {
      return res.render('404.html');
    }

    const forgot = await this.authService.getForgotByToken(token);
    if (!forgot) {
      return res.render('404.html');
    }
    if (moment(forgot.createdAt).isAfter(moment().add(1, 'day'))) {
      await this.authService.deleteForgotById(forgot._id);
      return res.render('404.html');
    }

    return res.render('password-change.html');
  }

  @Post('password-change')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  public async updatePasswordForm(
    @Res() res: Response,
    @Query('token') token: string,
    @Body('password') password: string
  ) {
    if (!token || !password || password.length < 6) {
      return res.render('404.html');
    }

    const forgot = await this.authService.getForgotByToken(token);
    if (!forgot) {
      return res.render('404.html');
    }
    // TODO - check forgot table
    await this.authService.updateAuthPassword(plainToInstance(AuthDto, {
      source: forgot.source,
      sourceId: forgot.sourceId,
      value: password
    }));
    await this.authService.deleteForgotBySourceId(forgot.sourceId);
    // TODO - should remove other forgot link?
    return res.render('password-change.html', {
      done: true
    });
  }
}
