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
import { RRRPointsService } from '../services';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';

/**
 * Controller for model-to-viewer point awards
 */
@ApiTags('loyalty-points')
@Controller('loyalty-points/awards')
export class RRRAwardsController {
  constructor(
    private readonly pointsService: RRRPointsService
  ) {}

  /**
   * Create award intent (model awarding points to viewer)
   */
  @Post('intents')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create model-to-viewer award intent' })
  async createAwardIntent(
    @Request() req,
    @Body('viewer_user_id') viewerUserId: string,
    @Body('points') points: number,
    @Body('context') context?: { room_id?: string; stream_id?: string }
  ) {
    const modelUserId = req.user._id;

    if (!viewerUserId || !points) {
      throw new BadRequestException('viewer_user_id and points are required');
    }

    if (points <= 0) {
      throw new BadRequestException('Points must be greater than 0');
    }

    try {
      const viewerObjectId = new ObjectId(viewerUserId);
      const intent = await this.pointsService.createAwardIntent(
        modelUserId,
        viewerObjectId,
        points,
        context
      );

      // If viewer is not linked, return helpful error
      if (!intent.eligible) {
        return {
          success: false,
          eligible: false,
          message: intent.ineligibility_reason || 'Viewer is not linked to RedRoomRewards. Please encourage them to sign up and link their account.',
          intent_id: intent.intent_id
        };
      }

      return {
        success: true,
        eligible: true,
        intent_id: intent.intent_id,
        max_points: intent.max_points
      };
    } catch (error) {
      if (error.message.includes('not linked')) {
        throw new BadRequestException('Viewer must be linked to RedRoomRewards before receiving awards');
      }
      throw error;
    }
  }

  /**
   * Commit award
   */
  @Post('commit')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Commit model-to-viewer award' })
  async commitAward(
    @Request() req,
    @Body('intent_id') intentId: string,
    @Body('viewer_user_id') viewerUserId: string
  ) {
    const modelUserId = req.user._id;

    if (!intentId || !viewerUserId) {
      throw new BadRequestException('intent_id and viewer_user_id are required');
    }

    const idempotencyKey = uuidv4();
    const viewerObjectId = new ObjectId(viewerUserId);

    await this.pointsService.commitAward(
      modelUserId,
      viewerObjectId,
      intentId,
      idempotencyKey
    );

    return {
      success: true,
      message: 'Award successfully committed'
    };
  }
}
