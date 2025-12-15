import { Module, forwardRef } from '@nestjs/common';
import { AgendaModule } from 'src/kernel';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { FeaturedCreatorApprovedService, FeaturedCreatorPackageSearchService, FeaturedCreatorPackageService } from './services';
import {
  AdminFeaturedPackageController, FeaturedCreatorBookingController, FeaturedCreatorPackageController
} from './controllers';
import { UpdateFeaturedCreatorBookingStatus } from './listeners';
import { PerformerModule } from '../performer/performer.module';
import { PurchasedItemModule } from '../purchased-item/purchased-item.module';
import {
  FeaturedCreatorBooking, FeaturedCreatorBookingSchema, FeaturedCreatorBookingStatus,
  FeaturedCreatorBookingStatusSchema, FeaturedCreatorPackage, FeaturedCreatorPackageSchema
} from './schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: FeaturedCreatorBooking.name,
        schema: FeaturedCreatorBookingSchema
      },
      {
        name: FeaturedCreatorPackage.name,
        schema: FeaturedCreatorPackageSchema
      },
      {
        name: FeaturedCreatorBookingStatus.name,
        schema: FeaturedCreatorBookingStatusSchema
      }
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => PurchasedItemModule),
    AgendaModule.register()
  ],
  providers: [
    FeaturedCreatorPackageService,
    FeaturedCreatorPackageSearchService,
    UpdateFeaturedCreatorBookingStatus,
    FeaturedCreatorApprovedService
  ],
  controllers: [AdminFeaturedPackageController, FeaturedCreatorPackageController, FeaturedCreatorBookingController],
  exports: [FeaturedCreatorPackageService, FeaturedCreatorPackageSearchService]
})
export class FeaturedCreatorModule {}
