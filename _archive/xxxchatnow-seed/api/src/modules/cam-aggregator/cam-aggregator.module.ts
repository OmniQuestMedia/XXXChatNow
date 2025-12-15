import * as https from 'https';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from 'nestjs-config';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { AgendaModule } from 'src/kernel';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { SettingModule } from '../settings/setting.module';
import { CamAggregatorController } from './controllers/cam-aggregator.controller';
import { BongacamsService } from './services/bongacams.service';
import { CamAggregatorService } from './services/cam-aggregator.service';
import { ChaturbateService } from './services/chaturbate.service';
import { StripcashService } from './services/stripcash.service';
import { XLoveCamService } from './services/xlovecam.service';
import {
  AggregatorCategory,
  AggregatorCategorySchema,
  AggregatorPerfomer,
  AggregatorPerfomerSchema
} from './schemas';

const agent = new https.Agent({
  rejectUnauthorized: false
});

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AggregatorCategory.name,
        schema: AggregatorCategorySchema
      },
      {
        name: AggregatorPerfomer.name,
        schema: AggregatorPerfomerSchema
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
    AgendaModule.register(),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
      httpsAgent: agent
    }),
    SettingModule,
    AuthModule
  ],
  providers: [XLoveCamService, ChaturbateService, BongacamsService, StripcashService, CamAggregatorService],
  controllers: [CamAggregatorController],
  exports: []
})
export class CamAggregatorModule {}
