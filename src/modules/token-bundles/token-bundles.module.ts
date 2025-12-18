import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenBundle } from './entities/token-bundle.entity';
import { TokenBundlesService } from './token-bundles.service';
import { AdminTokenBundlesController } from './controllers/admin-token-bundles.controller';
import { GuestTokenBundlesController } from './controllers/guest-token-bundles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TokenBundle])],
  controllers: [AdminTokenBundlesController, GuestTokenBundlesController],
  providers: [TokenBundlesService],
  exports: [TokenBundlesService],
})
export class TokenBundlesModule {}
