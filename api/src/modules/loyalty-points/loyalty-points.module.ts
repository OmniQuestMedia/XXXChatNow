import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from 'nestjs-config';
import {
  RRRAccountLink,
  RRRAccountLinkSchema
} from './schemas';
import {
  RRRApiClientService,
  RRRAccountLinkService,
  RRRPointsService
} from './services';
import {
  RRRLinkController,
  RRRWalletController,
  RRRWebhookController
} from './controllers';

/**
 * Loyalty Points Module
 * Handles RedRoomRewards integration
 */
@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5
    }),
    MongooseModule.forFeature([
      {
        name: RRRAccountLink.name,
        schema: RRRAccountLinkSchema
      }
    ])
  ],
  providers: [
    RRRApiClientService,
    RRRAccountLinkService,
    RRRPointsService
  ],
  controllers: [
    RRRLinkController,
    RRRWalletController,
    RRRWebhookController
  ],
  exports: [
    RRRApiClientService,
    RRRAccountLinkService,
    RRRPointsService
  ]
})
export class LoyaltyPointsModule {}
