import {
  Controller,
  Get,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { WalletService } from '../services';
import { WalletBalanceDto, WalletVerificationStatusDto } from '../dtos';

/**
 * Controller for wallet operations
 */
@ApiTags('wallet')
@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService
  ) {}

  /**
   * Get wallet balance for authenticated user
   */
  @Get('balance')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user wallet balance with verification status' })
  async getBalance(@Request() req): Promise<WalletBalanceDto> {
    const userId = req.user._id;
    return this.walletService.getBalance(userId);
  }

  /**
   * Get wallet verification status
   */
  @Get('verification-status')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get wallet verification status' })
  async getVerificationStatus(@Request() req): Promise<WalletVerificationStatusDto> {
    const userId = req.user._id;
    return this.walletService.getVerificationStatus(userId);
  }

  /**
   * Verify wallet
   */
  @Post('verify')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify wallet for authenticated user' })
  async verifyWallet(@Request() req): Promise<WalletVerificationStatusDto> {
    const userId = req.user._id;
    const metadata = {
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent']
    };
    return this.walletService.verifyWallet(userId, metadata);
  }
}
