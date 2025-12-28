import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/schemas/user.schema';
import { WalletVerificationAttempt, WalletVerificationAttemptSchema } from './schemas';
import { WalletController } from './controllers';
import { WalletService, WalletRateLimitService } from './services';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: WalletVerificationAttempt.name, schema: WalletVerificationAttemptSchema }
    ])
  ],
  controllers: [WalletController],
  providers: [WalletService, WalletRateLimitService],
  exports: [WalletService, WalletRateLimitService]
})
export class WalletModule {}
