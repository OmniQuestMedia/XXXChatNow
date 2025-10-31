import {
  Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards, UsePipes, ValidationPipe
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse } from 'src/kernel';
import { PerformerDto } from 'src/modules/performer/dtos';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { StreamGoalsService } from '../services';
import { StreamGoalResponse } from '../interface';
import { StreamGoalPayload } from '../payloads';

@Controller('streaming/goals')
export class StreamGoalsController {
  constructor(private readonly streamGoalService: StreamGoalsService) {}

  @Post('/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async create(
    @Body() payload: StreamGoalPayload,
    @Param('id') streamId: string,
    @CurrentUser() currentUser: PerformerDto
  ): Promise<DataResponse<StreamGoalResponse>> {
    const result = await this.streamGoalService.create(streamId, payload, currentUser);
    return DataResponse.ok(result);
  }

  @Get('/search')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async search(
    @Query('id') streamId: string
  ): Promise<DataResponse<StreamGoalResponse>> {
    const results = await this.streamGoalService.loadGoals(streamId);
    return DataResponse.ok(results);
  }

  @Post('/reset/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async resetGoal(
    @Param('id') streamId: string,
    @CurrentUser() currentUser: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = await this.streamGoalService.resetRemainBalance(streamId, currentUser);
    return DataResponse.ok(data);
  }
}
