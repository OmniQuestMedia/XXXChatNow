import {
  HttpCode,
  HttpStatus,
  Controller,
  Injectable,
  UseGuards,
  Body,
  Post,
  UsePipes,
  ValidationPipe,
  Delete
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { DataResponse } from 'src/kernel';
import { UserDto } from 'src/modules/user/dtos';
import { UserNotificationPayload } from '../../notification/payloads/user-notification.payload';
import { NotificationService } from '../services/notification.service';

@Injectable()
@Controller('notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService
  ) { }

  @Post('/me')
  @HttpCode(HttpStatus.OK)
  @Roles('user')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async notifyMe(
    @CurrentUser() currentUser: UserDto,
    @Body() payload: UserNotificationPayload
  ): Promise<DataResponse<any>> {
    await this.notificationService.notifyMe(currentUser._id, payload.performerId);
    return DataResponse.ok(true);
  }

  @Delete('/remove')
  @HttpCode(HttpStatus.OK)
  @Roles('user')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async unNotifyMe(
    @CurrentUser() currentUser: UserDto,
    @Body() payload: UserNotificationPayload
  ): Promise<DataResponse<any>> {
    const notify = await this.notificationService.findOne({
      userId: currentUser._id,
      performerId: payload.performerId
    });
    await this.notificationService.unNofify(notify._id);
    return DataResponse.ok(true);
  }
}
