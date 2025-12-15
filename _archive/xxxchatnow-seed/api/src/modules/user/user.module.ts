import { Module, forwardRef } from '@nestjs/common';
import { AgendaModule } from 'src/kernel';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserController,
  AvatarController,
  AdminUserController,
  AdminAvatarController
} from './controllers';
import { UserService, UserSearchService } from './services';
import { AuthModule } from '../auth/auth.module';
import { UserConnectedListener } from './listeners/user-connected.listener';
import { SettingModule } from '../settings/setting.module';
import { SocketModule } from '../socket/socket.module';
import { PerformerAssetsModule } from '../performer-assets/performer-assets.module';
import { User, UserSchema } from './schemas/user.schema';
import { ShippingInfo, ShippingInfoSchema } from './schemas/shipping-info.schema';
import { PerformerModule } from '../performer/performer.module';
import { UserRankModel } from './models/user-rank.model';
import { UserRankSchema } from './schemas/user-rank.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema
      },
      {
        name: ShippingInfo.name,
        schema: ShippingInfoSchema
      },
      {
        name: UserRankModel.name,
        schema: UserRankSchema
      }
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => SettingModule),
    AgendaModule.register(),
    forwardRef(() => SocketModule),
    forwardRef(() => PerformerAssetsModule),
    forwardRef(() => PerformerModule)
  ],
  providers: [
    UserService, UserSearchService, UserConnectedListener
  ],
  controllers: [
    UserController,
    AvatarController,
    AdminUserController,
    AdminAvatarController
  ],
  exports: [UserService, UserSearchService, UserConnectedListener]
})
export class UserModule { }
