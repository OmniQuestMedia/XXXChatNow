import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationListener } from './linteners/notification.listener';
import { PushNotificationController, PushNotificationTokenController } from './constrollers';
import { PushNotificationService, PushNotificationTokenService } from './services';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { PushNotificationToken, PushNotificationTokenSchema } from './schemas';
import { SettingModule } from '../settings/setting.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Notification.name,
        schema: NotificationSchema
      },
      {
        name: PushNotificationToken.name,
        schema: PushNotificationTokenSchema
      }
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    forwardRef(() => SettingModule)
  ],
  providers: [NotificationService, NotificationListener, PushNotificationService, PushNotificationTokenService],

  controllers: [
    NotificationController,
    PushNotificationController, PushNotificationTokenController
  ],
  exports: [NotificationService, NotificationListener]
})
export class NotificationModule { }
