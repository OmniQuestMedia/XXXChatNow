/**
 * Admin Slot Machine Controller
 * 
 * Admin-only endpoints for slot machine management.
 * 
 * Features:
 * - Create and manage configurations
 * - View all transactions for audit
 * - Monitor system health
 * 
 * References:
 * - XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md
 */

import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Injectable
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { DataResponse } from 'src/kernel';
import { UserDto } from 'src/modules/user/dtos';
import { SlotMachineConfigService } from '../services/slot-machine-config.service';
import { SlotMachineConfigDto } from '../dtos';

@Injectable()
@Controller('admin/slot-machine')
export class AdminSlotMachineController {
  constructor(
    private readonly configService: SlotMachineConfigService
  ) {}

  /**
   * Get all configurations (admin only)
   * 
   * GET /api/v1/admin/slot-machine/configs
   */
  @Get('/configs')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  async getAllConfigs(): Promise<DataResponse<SlotMachineConfigDto[]>> {
    const configs = await this.configService.getAllConfigs();
    return DataResponse.ok(configs.map(c => new SlotMachineConfigDto(c)));
  }

  /**
   * Get active configuration (admin only)
   * 
   * GET /api/v1/admin/slot-machine/config/active
   */
  @Get('/config/active')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  async getActiveConfig(): Promise<DataResponse<SlotMachineConfigDto>> {
    const config = await this.configService.getActiveConfig();
    return DataResponse.ok(new SlotMachineConfigDto(config));
  }

  /**
   * Create new configuration (admin only)
   * 
   * POST /api/v1/admin/slot-machine/config
   * 
   * TODO: Add payload validation class
   */
  @Post('/config')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createConfig(
    @CurrentUser() admin: UserDto,
    @Body() configData: any
  ): Promise<DataResponse<SlotMachineConfigDto>> {
    const config = await this.configService.createConfig(
      configData,
      admin.username || admin._id.toString()
    );
    return DataResponse.ok(new SlotMachineConfigDto(config));
  }

  /**
   * Activate configuration (admin only)
   * 
   * PUT /api/v1/admin/slot-machine/config/:id/activate
   */
  @Put('/config/:id/activate')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  async activateConfig(
    @CurrentUser() admin: UserDto,
    @Param('id') id: string
  ): Promise<DataResponse<SlotMachineConfigDto>> {
    const config = await this.configService.activateConfig(
      id,
      admin.username || admin._id.toString()
    );
    return DataResponse.ok(new SlotMachineConfigDto(config));
  }

  // TODO: Add transaction search endpoint for admin audit
  // GET /api/v1/admin/slot-machine/transactions
  
  // TODO: Add analytics endpoint
  // GET /api/v1/admin/slot-machine/analytics
}
