import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RRRPromotionsService } from '../services';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';

/**
 * Controller for manual points adjustments (admin/CS only)
 */
@ApiTags('loyalty-points')
@Controller('loyalty-points/adjustments')
@UseGuards(AuthGuard, RolesGuard)
export class RRRAdjustmentsController {
  constructor(
    private readonly promotionsService: RRRPromotionsService
  ) {}

  /**
   * Create manual adjustment
   * Thresholds:
   * - <=100 points: 1 XCN admin
   * - 101-500 points: 2 XCN admins
   * - >500 points: 2 XCN admins + 1 RRR admin
   */
  @Post()
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create manual points adjustment' })
  async createAdjustment(
    @Request() req,
    @Body('user_id') userId: string,
    @Body('points') points: number,
    @Body('reason_code') reasonCode: string,
    @Body('ticket_reference') ticketReference: string,
    @Body('metadata') metadata?: Record<string, any>
  ) {
    const adminId = req.user._id.toString();

    if (!userId || !points || !reasonCode || !ticketReference) {
      throw new BadRequestException('user_id, points, reason_code, and ticket_reference are required');
    }

    const idempotencyKey = uuidv4();
    const userObjectId = new ObjectId(userId);

    const result = await this.promotionsService.createAdjustment(
      userObjectId,
      points,
      reasonCode,
      ticketReference,
      adminId,
      idempotencyKey,
      metadata
    );

    // Get threshold info for response
    const absPoints = Math.abs(points);
    let approvalRequirement = '1 XCN admin';
    
    if (absPoints > 500) {
      approvalRequirement = '2 XCN admins + 1 RRR admin';
    } else if (absPoints > 100) {
      approvalRequirement = '2 XCN admins';
    }

    return {
      success: true,
      ledger_entry_id: result.ledger_entry_id,
      status: result.status,
      approval_requirement: approvalRequirement,
      message: `Adjustment created. Requires: ${approvalRequirement}`
    };
  }
}
