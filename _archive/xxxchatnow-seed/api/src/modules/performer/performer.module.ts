import { Module, forwardRef } from '@nestjs/common';
import { SettingModule } from 'src/modules/settings/setting.module';
import { MessageModule } from 'src/modules/message/message.module';
import { ConfigService } from 'nestjs-config';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import {
  CategoryService,
  CategorySearchService,
  PerformerService,
  PerformerSearchService,
  PerformerCommissionService,
  PerformerBlockSettingService,
  WatermarkSettingService
} from './services';
import {
  CategoryController,
  AdminCategoryController,
  AdminPerformerController,
  PerformerController,
  AdminPerformerCommissionController,
  WatermarkSettingController
} from './controllers';
import { UserModule } from '../user/user.module';
import {
  PerformerAssetsListener,
  PerformerConnectedListener,
  PerformerFavoriteListener,
  BlockUserListener,
  PerformerListener
} from './listeners';
import { StreamModule } from '../stream/stream.module';
import { FavouriteModule } from '../favourite/favourite.module';
import { SocketModule } from '../socket/socket.module';
import { StudioModule } from '../studio/studio.module';
import { PerformerTask } from './tasks/performer.task';
import {
  BlockSetting,
  BlockSettingSchema,
  Category,
  CategorySchema,
  Performer,
  PerformerCommission,
  PerformerCommissionSchema,
  PerformerSchema,
  WatermarkSetting,
  WatermarkSettingSchema
} from './schemas';
import { ReferralModule } from '../referral/referral.module';
import { WheelModule } from '../wheel/wheel.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Performer.name,
        schema: PerformerSchema
      },
      {
        name: WatermarkSetting.name,
        schema: WatermarkSettingSchema
      },
      {
        name: Category.name,
        schema: CategorySchema
      },
      {
        name: PerformerCommission.name,
        schema: PerformerCommissionSchema
      },
      {
        name: BlockSetting.name,
        schema: BlockSettingSchema
      }
    ]),
    RedisModule.forRootAsync({
      // TODO - load config for redis socket
      useFactory: (configService: ConfigService) => ({
        config: configService.get('redis')
      }),
      // useFactory: async (configService: ConfigService) => configService.get('redis'),
      inject: [ConfigService]
    }),
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    forwardRef(() => FavouriteModule),
    forwardRef(() => SettingModule),
    forwardRef(() => AuthModule),
    forwardRef(() => StreamModule),
    forwardRef(() => SocketModule),
    forwardRef(() => StudioModule),
    MessageModule,
    forwardRef(() => ReferralModule),
    forwardRef(() => WheelModule)
  ],
  providers: [
    CategoryService,
    CategorySearchService,
    PerformerService,
    PerformerSearchService,
    PerformerAssetsListener,
    PerformerConnectedListener,
    PerformerFavoriteListener,
    BlockUserListener,
    PerformerCommissionService,
    PerformerBlockSettingService,
    PerformerListener,
    PerformerTask,
    WatermarkSettingService
  ],
  controllers: [
    CategoryController,
    AdminCategoryController,
    AdminPerformerController,
    PerformerController,
    AdminPerformerCommissionController,
    WatermarkSettingController
  ],
  exports: [
    CategoryService,
    PerformerService,
    PerformerCommissionService,
    PerformerSearchService,
    PerformerBlockSettingService,
    WatermarkSettingService
  ]
})
export class PerformerModule { }
