/**
 * Slot Machine API Controller
 * 
 * Main API endpoints for slot machine feature.
 * 
 * Security Features:
 * - Authentication required on all endpoints (@UseGuards)
 * - Rate limiting enforced (service layer)
 * - Input validation via DTOs
 * - Idempotency key enforcement
 * - Server-side only calculations
 * 
 * UI HOOK POINTS (for future frontend integration):
 * - POST /slot-machine/spin - Initiate a spin
 * - GET /slot-machine/history - Get user's spin history
 * - GET /slot-machine/config - Get current configuration
 * - GET /slot-machine/rate-limit - Get remaining spins
 * 
 * References:
 * - XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md (API Specification section)
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Headers,
  Req,
  Injectable
} from '@nestjs/common';
import { Request } from 'express';
import { RoleGuard } from 'src/modules/auth/guards';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { DataResponse } from 'src/kernel';
import { UserDto } from 'src/modules/user/dtos';
import { SlotMachineService } from '../services/slot-machine.service';
import { SlotMachineConfigService } from '../services/slot-machine-config.service';
import { SlotMachineRateLimitService } from '../services/slot-machine-rate-limit.service';
import {
  SlotMachineSpinResultDto,
  SlotMachineHistoryItemDto,
  SlotMachinePublicConfigDto
} from '../dtos';
import { SpinPayload, SlotMachineHistoryPayload } from '../payloads';
import * as crypto from 'crypto';

@Injectable()
@Controller('slot-machine')
export class SlotMachineController {
  constructor(
    private readonly slotMachineService: SlotMachineService,
    private readonly configService: SlotMachineConfigService,
    private readonly rateLimitService: SlotMachineRateLimitService
  ) {}

  /**
   * UI HOOK POINT: Spin the slot machine
   * 
   * POST /api/v1/slot-machine/spin
   * 
   * Security:
   * - Requires authentication
   * - Rate limiting enforced (100 spins/hour)
   * - Idempotency key required
   * - Balance validated atomically
   * - Server-side RNG and payout calculation
   * 
   * Headers:
   * - Authorization: Bearer <token>
   * - Idempotency-Key: <unique-key>
   * 
   * Body:
   * {
   *   "betAmount": 100
   * }
   * 
   * Response 200:
   * {
   *   "spinId": "string",
   *   "timestamp": "ISO8601",
   *   "betAmount": number,
   *   "result": {
   *     "symbols": ["string", "string", "string"],
   *     "isWin": boolean,
   *     "payout": number,
   *     "multiplier": number
   *   },
   *   "newBalance": number,
   *   "previousBalance": number
   * }
   */
  @Post('/spin')
  @Roles('user', 'performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async spin(
    @CurrentUser() user: UserDto,
    @Body() payload: SpinPayload,
    @Headers('idempotency-key') idempotencyKey: string,
    @Req() req: Request
  ): Promise<DataResponse<SlotMachineSpinResultDto>> {
    // Generate idempotency key if not provided
    if (!idempotencyKey) {
      idempotencyKey = crypto.randomBytes(16).toString('hex');
    }

    // Extract metadata from request (no PII)
    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      sessionId: req.session?.id
    };

    const transaction = await this.slotMachineService.spin(
      user._id,
      payload.betAmount,
      idempotencyKey,
      metadata
    );

    return DataResponse.ok(new SlotMachineSpinResultDto(transaction));
  }

  /**
   * UI HOOK POINT: Get spin history
   * 
   * GET /api/v1/slot-machine/history?limit=20&offset=0
   * 
   * Returns paginated list of user's spin history.
   */
  @Get('/history')
  @Roles('user', 'performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async getHistory(
    @CurrentUser() user: UserDto,
    @Query() query: SlotMachineHistoryPayload
  ): Promise<DataResponse<{
    spins: SlotMachineHistoryItemDto[];
    total: number;
    limit: number;
    offset: number;
  }>> {
    const { data, total } = await this.slotMachineService.getHistory(
      user._id,
      query.limit,
      query.offset
    );

    return DataResponse.ok({
      spins: data.map(t => new SlotMachineHistoryItemDto(t)),
      total,
      limit: query.limit,
      offset: query.offset
    });
  }

  /**
   * UI HOOK POINT: Get current slot machine configuration
   * 
   * GET /api/v1/slot-machine/config
   * 
   * Returns current symbols, payouts, and limits.
   * Public endpoint (authenticated users only).
   */
  @Get('/config')
  @Roles('user', 'performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  async getConfig(): Promise<DataResponse<SlotMachinePublicConfigDto>> {
    const config = await this.configService.getActiveConfig();
    return DataResponse.ok(new SlotMachinePublicConfigDto(config));
  }

  /**
   * UI HOOK POINT: Get rate limit status
   * 
   * GET /api/v1/slot-machine/rate-limit
   * 
   * Returns remaining spins and reset time.
   * Useful for UI to display spin limits.
   */
  @Get('/rate-limit')
  @Roles('user', 'performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  async getRateLimit(
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<{
    remaining: number;
    used: number;
    resetTime: Date;
  }>> {
    const config = await this.configService.getActiveConfig();
    const rateLimitInfo = await this.rateLimitService.getRemainingSpins(
      user._id,
      config.maxSpinsPerHour
    );

    return DataResponse.ok(rateLimitInfo);
  }

  // TODO: UI HOOK POINT - Add WebSocket endpoint for real-time spin results
  // This would allow for more engaging UI animations and instant feedback

  // TODO: UI HOOK POINT - Add leaderboard endpoint
  // GET /api/v1/slot-machine/leaderboard
  // Returns top winners for the day/week/month

  // TODO: UI HOOK POINT - Add statistics endpoint
  // GET /api/v1/slot-machine/stats
  // Returns user's total spins, wins, biggest win, etc.
}
