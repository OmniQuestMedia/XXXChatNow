import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RRRPointsService } from '../services';
import { RRRRedemptionMode } from '../constants';
import { RRRWalletDto } from '../dtos';

/**
 * Controller for RRR points balance and wallet endpoints
 */
@ApiTags('loyalty-points')
@Controller('loyalty-points/wallet')
export class RRRWalletController {
  constructor(
    private readonly pointsService: RRRPointsService
  ) {}

  /**
   * Get wallet balance for authenticated user
   */
  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user loyalty points wallet' })
  async getWallet(@Request() req): Promise<RRRWalletDto | null> {
    const userId = req.user._id;
    return this.pointsService.getUserWallet(userId);
  }

  /**
   * Quote redemption for checkout
   */
  @Post('quote-redemption')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quote points redemption for checkout' })
  async quoteRedemption(
    @Request() req,
    @Body('cart_total_minor') cartTotalMinor: number,
    @Body('currency') currency: string,
    @Body('mode') mode: RRRRedemptionMode,
    @Body('requested_points') requestedPoints?: number
  ) {
    const userId = req.user._id;
    return this.pointsService.quoteRedemption(
      userId,
      cartTotalMinor,
      currency,
      mode,
      requestedPoints
    );
  }

  /**
   * Quote top-up (for when user is short of points)
   */
  @Post('quote-topup')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quote points top-up purchase' })
  async quoteTopUp(
    @Request() req,
    @Body('bundle') bundle: number,
    @Body('unit_price_minor') unitPriceMinor?: number
  ) {
    return this.pointsService.quoteTopUp(bundle, unitPriceMinor || 3);
  }
}
