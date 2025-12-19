import { Module, forwardRef } from '@nestjs/common';
import { PerformerModule } from 'src/modules/performer/performer.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MenuService, SettingService } from './services';
import { AuthModule } from '../auth/auth.module';
import {
  MenuController,
  SettingController,
  SettingFileUploadController,
  AdminSettingController,
  AdminMenuController
} from './controllers';
import {
  Menu, MenuSchema, Setting, SettingSchema
} from './schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Setting.name,
        schema: SettingSchema
      },
      {
        name: Menu.name,
        schema: MenuSchema
      }
    ]),
    forwardRef(() => PerformerModule),
    forwardRef(() => AuthModule)
  ],
  providers: [
    SettingService,
    MenuService
  ],
  controllers: [
    SettingFileUploadController,
    AdminSettingController,
    AdminMenuController,
    SettingController,
    MenuController
  ],
  exports: [
    SettingService,
    MenuService
  ]
})
export class SettingModule {
  constructor(private settingService: SettingService) {
    this.settingService.syncCache();
  }
}
