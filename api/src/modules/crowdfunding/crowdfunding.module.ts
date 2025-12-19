import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { CrowdfundingController } from './controllers';
import { CrowdfundingService } from './services';
import { PerformerModule } from '../performer/performer.module';
import { Crowdfunding, CrowdfundingSchema } from './schemas';
import { PurchasedItemModule } from '../purchased-item/purchased-item.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Crowdfunding.name,
        schema: CrowdfundingSchema
      }
    ]),
    // inject user module because we request guard from auth, need to check and fix dependencies if not needed later
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    forwardRef(() => PurchasedItemModule),
    forwardRef(() => PerformerModule)
  ],
  providers: [CrowdfundingService],
  controllers: [
    CrowdfundingController
  ],
  exports: [
    CrowdfundingService,
    MongooseModule
  ]
})
export class CrowdfundingModule {}
