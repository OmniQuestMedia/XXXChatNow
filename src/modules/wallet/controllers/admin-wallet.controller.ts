import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { WalletService } from '../wallet.service';
import { AwardTokensDto } from '../dto/award-tokens.dto';

@Controller('admin/wallet')
export class AdminWalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('award')
  awardTokens(@Body() awardTokensDto: AwardTokensDto) {
    return this.walletService.awardTokens(awardTokensDto);
  }

  @Post('expire/:lotId')
  expireLot(@Param('lotId') lotId: string) {
    return this.walletService.expireLot(lotId);
  }

  @Get('audit/:userId')
  getAuditTrail(@Param('userId') userId: string) {
    return this.walletService.getAuditTrail(userId);
  }
}
