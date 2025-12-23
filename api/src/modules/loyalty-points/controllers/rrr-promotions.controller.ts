import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RRRPromotionsService } from '../services';
import { CreatePromotionDto } from '../dtos';
import { RRRActorType } from '../constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * Controller for RRR promotions management (admin only)
 */
@ApiTags('loyalty-points')
@Controller('loyalty-points/promotions')
@UseGuards(AuthGuard, RolesGuard)
export class RRRPromotionsController {
  constructor(
    private readonly promotionsService: RRRPromotionsService
  ) {}

  /**
   * Create a new promotion (admin only)
   */
  @Post()
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new promotion' })
  async createPromotion(
    @Request() req,
    @Body() dto: CreatePromotionDto
  ) {
    const idempotencyKey = uuidv4();
    return this.promotionsService.createPromotion(dto, idempotencyKey);
  }

  /**
   * Update a promotion (admin only)
   */
  @Patch(':promotionId')
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update promotion' })
  async updatePromotion(
    @Request() req,
    @Param('promotionId') promotionId: string,
    @Body() dto: Partial<CreatePromotionDto>
  ) {
    const idempotencyKey = uuidv4();
    return this.promotionsService.updatePromotion(promotionId, dto, idempotencyKey);
  }

  /**
   * Submit promotion for approval (admin only)
   */
  @Post(':promotionId/submit')
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit promotion for approval' })
  async submitForApproval(
    @Request() req,
    @Param('promotionId') promotionId: string
  ) {
    const idempotencyKey = uuidv4();
    await this.promotionsService.submitForApproval(promotionId, idempotencyKey);
    return { success: true, message: 'Promotion submitted for approval' };
  }

  /**
   * Approve promotion (admin only, multi-sig required)
   */
  @Post(':promotionId/approve')
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve promotion (multi-sig: 2 XCN admins + 1 RRR admin required)' })
  async approvePromotion(
    @Request() req,
    @Param('promotionId') promotionId: string
  ) {
    const adminId = req.user._id.toString();
    const idempotencyKey = uuidv4();
    
    await this.promotionsService.approvePromotion(
      promotionId,
      adminId,
      RRRActorType.CLIENT_ADMIN,
      idempotencyKey
    );

    return { success: true, message: 'Approval recorded' };
  }

  /**
   * Get promotion by ID (admin only)
   */
  @Get(':promotionId')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get promotion details' })
  async getPromotion(
    @Request() req,
    @Param('promotionId') promotionId: string
  ) {
    return this.promotionsService.getPromotion(promotionId);
  }

  /**
   * List promotions (admin only)
   */
  @Get()
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List promotions' })
  async listPromotions(
    @Request() req,
    @Query('status') status?: string
  ) {
    return this.promotionsService.listPromotions(status);
  }
}
