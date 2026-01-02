import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { MoodMessagingService } from '../services';
import { SelectMoodResponseDto, UpdateModelConfigDto } from '../dtos';

/**
 * MoodMessagingController
 * Handles mood messaging API endpoints
 */
@ApiTags('mood-messaging')
@Controller('mood-messaging')
export class MoodMessagingController {
  constructor(private readonly moodMessagingService: MoodMessagingService) {}

  /**
   * Select a mood response from a bucket
   */
  @Post('select')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Select a mood response',
    description: 'Selects a random response from a specified mood bucket using secure randomization'
  })
  @ApiResponse({
    status: 200,
    description: 'Response selected successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        response: { type: 'string', example: "It's great to see you in high spirits! How can I assist you today?" },
        bucketId: { type: 'string', example: '507f1f77bcf86cd799439012' },
        bucketName: { type: 'string', example: 'happy' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Mood bucket not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async selectResponse(
    @Request() req,
    @Body() dto: SelectMoodResponseDto
  ) {
    const userId = req.user._id.toString();
    return this.moodMessagingService.selectMoodResponse(dto, userId);
  }

  /**
   * Get model configuration
   * Only accessible by performers for their own configuration
   */
  @Get('model-config')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get model configuration',
    description: 'Retrieves the mood messaging configuration for the authenticated model'
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        config: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - User is not a performer' })
  async getModelConfig(@Request() req) {
    // Check if user is a performer
    if (!this.isPerformer(req.user)) {
      throw new ForbiddenException('Only performers can access this endpoint');
    }

    const performerId = req.user._id.toString();
    const config = await this.moodMessagingService.getModelConfig(performerId);

    return {
      success: true,
      config
    };
  }

  /**
   * Update model configuration
   * Only accessible by performers for their own configuration
   */
  @Put('model-config')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Update model configuration',
    description: 'Updates the mood messaging configuration for the authenticated model'
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Configuration updated successfully' },
        config: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - User is not a performer' })
  async updateModelConfig(
    @Request() req,
    @Body() dto: UpdateModelConfigDto
  ) {
    // Check if user is a performer
    if (!this.isPerformer(req.user)) {
      throw new ForbiddenException('Only performers can access this endpoint');
    }

    const performerId = req.user._id.toString();
    const config = await this.moodMessagingService.updateModelConfig(performerId, dto);

    return {
      success: true,
      message: 'Configuration updated successfully',
      config
    };
  }

  /**
   * Restore default configuration
   * Only accessible by performers for their own configuration
   */
  @Post('restore-defaults')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Restore default configuration',
    description: "Resets the model's configuration to system defaults"
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration restored successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Configuration restored to defaults' },
        config: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - User is not a performer' })
  async restoreDefaults(@Request() req) {
    // Check if user is a performer
    if (!this.isPerformer(req.user)) {
      throw new ForbiddenException('Only performers can access this endpoint');
    }

    const performerId = req.user._id.toString();
    const config = await this.moodMessagingService.restoreDefaults(performerId);

    return {
      success: true,
      message: 'Configuration restored to defaults',
      config
    };
  }

  /**
   * Helper method to check if user is a performer
   * @param user User object from request
   * @returns true if user is a performer
   */
  private isPerformer(user: any): boolean {
    // Check if user has performer role
    // This assumes the user object has a 'roles' field
    // Adjust based on actual user schema
    return user && user.roles && user.roles.includes('performer');
  }
}
