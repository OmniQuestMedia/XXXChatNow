import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { WalletService } from '../wallet.service';
import { SpendTokensDto } from '../dto/spend-tokens.dto';

@Controller('guest/wallet')
export class GuestWalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance/:userId')
  getBalance(@Param('userId') userId: string) {
    return this.walletService.getBalance(userId);
  }

  @Post('spend/:userId')
  spendTokens(@Param('userId') userId: string, @Body() spendTokensDto: SpendTokensDto) {
    return this.walletService.spendTokens(userId, spendTokensDto);
  }

  @Get('lots/:userId')
  getActiveLots(@Param('userId') userId: string) {
    return this.walletService.getActiveLots(userId);
  }

  @Get('transactions/:userId')
  getTransactions(@Param('userId') userId: string, @Query('limit') limit?: number) {
    return this.walletService.getTransactions(userId, limit);
  }
}
