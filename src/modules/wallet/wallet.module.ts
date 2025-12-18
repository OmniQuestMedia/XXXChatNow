import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenLot } from './entities/token-lot.entity';
import { TokenTransaction } from './entities/token-transaction.entity';
import { WalletService } from './wallet.service';
import { AdminWalletController } from './controllers/admin-wallet.controller';
import { GuestWalletController } from './controllers/guest-wallet.controller';
import { PolicyModule } from '../policy/policy.module';

@Module({
  imports: [TypeOrmModule.forFeature([TokenLot, TokenTransaction]), PolicyModule],
  controllers: [AdminWalletController, GuestWalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
