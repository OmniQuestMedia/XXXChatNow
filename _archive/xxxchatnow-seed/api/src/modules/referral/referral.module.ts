import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule } from 'src/kernel';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { PerformerModule } from '../performer/performer.module';
import { AuthModule } from '../auth/auth.module';
import { ReferralService } from './services/referral.service';
import { ReferralController } from './controllers/referral.controller';
import {
  ReferralCode, ReferralCodeSchema, ReferralUser, ReferralUserSchema
} from './schemas/referral.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ReferralUser.name,
        schema: ReferralUserSchema
      },
      {
        name: ReferralCode.name,
        schema: ReferralCodeSchema
      }
    ]),
    MongoDBModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    forwardRef(() => PerformerModule)
  ],
  providers: [
    ReferralService
  ],
  controllers: [
    ReferralController
  ],
  exports: [
    ReferralService
  ]
})
export class ReferralModule {}
