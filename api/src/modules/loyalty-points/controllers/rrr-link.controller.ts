import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RRRAccountLinkService } from '../services';
import { RRRLinkType } from '../constants';
import { ConfirmLinkDto, LinkStatusDto } from '../dtos';

/**
 * Controller for RRR account linking endpoints
 */
@ApiTags('loyalty-points')
@Controller('loyalty-points/links')
export class RRRLinkController {
  constructor(
    private readonly accountLinkService: RRRAccountLinkService
  ) {}

  /**
   * Create a link intent for the authenticated user
   */
  @Post('intents')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create RRR account link intent' })
  async createLinkIntent(
    @Request() req,
    @Body('link_type') linkType: RRRLinkType
  ) {
    const userId = req.user._id;
    return this.accountLinkService.createLinkIntent(userId, linkType);
  }

  /**
   * Confirm a link
   */
  @Post('confirm')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm RRR account link' })
  async confirmLink(
    @Request() req,
    @Body() dto: ConfirmLinkDto
  ): Promise<{ success: boolean }> {
    const userId = req.user._id;
    await this.accountLinkService.confirmLink(userId, dto);
    return { success: true };
  }

  /**
   * Get link status for authenticated user
   */
  @Get('status')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get RRR account link status' })
  async getLinkStatus(@Request() req): Promise<LinkStatusDto> {
    const userId = req.user._id;
    return this.accountLinkService.getLinkStatus(userId);
  }

  /**
   * Revoke link for authenticated user
   */
  @Post('revoke')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke RRR account link' })
  async revokeLink(@Request() req): Promise<{ success: boolean }> {
    const userId = req.user._id;
    await this.accountLinkService.revokeLink(userId);
    return { success: true };
  }
}
