import {
  Body,
  Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards
} from '@nestjs/common';
import { AuthGuard } from 'src/modules/auth/guards';
import { DataResponse } from 'src/kernel';
import { CurrentUser } from 'src/modules/auth/decorators';
import { UserDto } from 'src/modules/user/dtos';
import { PushNotificationTokenPayload, PushNotificationTokenSearchPayload } from '../payloads';
import { PushNotificationTokenService } from '../services';

@Controller('notification/token')
export class PushNotificationTokenController {
  constructor(private readonly pushNotificationTokenService: PushNotificationTokenService) {}

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  public async create(@Body() payload: PushNotificationTokenPayload, @CurrentUser() user: UserDto) {
    return DataResponse.ok(await this.pushNotificationTokenService.create(payload, user));
  }

  @Delete('/:id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  public async delete(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return DataResponse.ok(await this.pushNotificationTokenService.delete(id, user));
  }

  @Get('/search')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  public async search(@Query() query: PushNotificationTokenSearchPayload, @CurrentUser() user: UserDto) {
    return DataResponse.ok(await this.pushNotificationTokenService.search(query, user));
  }
}
