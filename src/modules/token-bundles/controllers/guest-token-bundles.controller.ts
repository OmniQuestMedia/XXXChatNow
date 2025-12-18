import { Controller, Get, Param } from '@nestjs/common';
import { TokenBundlesService } from '../token-bundles.service';
import { UserTier } from '../entities/token-bundle.entity';

@Controller('guest/token-bundles')
export class GuestTokenBundlesController {
  constructor(private readonly tokenBundlesService: TokenBundlesService) {}

  @Get(':tier')
  getByTier(@Param('tier') tier: UserTier) {
    return this.tokenBundlesService.findByTier(tier);
  }

  @Get('menu/:tier')
  getMenuForTier(@Param('tier') tier: UserTier) {
    return this.tokenBundlesService.getMenuForTier(tier);
  }

  @Get('menu')
  getAllMenus() {
    return this.tokenBundlesService.getAllMenus();
  }
}
