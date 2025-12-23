import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from 'nestjs-config';
import {
  RRRAccountLink,
  RRRAccountLinkSchema,
  RRRWebhookEvent,
  RRRWebhookEventSchema
} from './schemas';
import {
  RRRApiClientService,
  RRRAccountLinkService,
  RRRPointsService,
  RRRPromotionsService
} from './services';
import {
  RRRLinkController,
  RRRWalletController,
  RRRWebhookController,
  RRRAwardsController,
  RRRPromotionsController,
  RRRAdjustmentsController
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
      },
      {
        name: RRRWebhookEvent.name,
        schema: RRRWebhookEventSchema
      }
    ])
  ],
  providers: [
    RRRApiClientService,
    RRRAccountLinkService,
    RRRPointsService,
    RRRPromotionsService
  ],
  controllers: [
    RRRLinkController,
    RRRWalletController,
    RRRWebhookController,
    RRRAwardsController,
    RRRPromotionsController,
    RRRAdjustmentsController
  ],
  exports: [
    RRRApiClientService,
    RRRAccountLinkService,
    RRRPointsService,
    RRRPromotionsService
  ]
})
export class LoyaltyPointsModule {}
