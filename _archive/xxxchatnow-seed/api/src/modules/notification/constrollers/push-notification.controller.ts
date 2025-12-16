import {
  Body, Controller, HttpCode, HttpStatus, Post, UseGuards
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { Roles } from 'src/modules/auth/decorators';
import { DataResponse } from 'src/kernel';
import { PushNotificationService } from '../services';
import { PushNotificationMessage } from '../payloads';

@Controller('notification')
export class PushNotificationController {
  constructor(private readonly pushNotificationService: PushNotificationService) {}

  @Post('/send')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  public async sendMessage(@Body() payload: PushNotificationMessage) {
    return DataResponse.ok(await this.pushNotificationService.sendMessage(payload));
  }
}
