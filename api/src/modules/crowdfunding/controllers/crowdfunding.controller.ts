import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Injectable, Param, Post, Put, Query, UseGuards, UsePipes, ValidationPipe
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { DataResponse, PageableData } from 'src/kernel';
import { PerformerDto } from 'src/modules/performer/dtos';
import { ObjectId } from 'mongoose';
import { CrowdfundingDto } from '../dtos/crowdfunding.dto';
import { CrowdfundingService } from '../services';
import { CrowdfundingSearchPayload, CrowdfundingUpdatePayload } from '../payloads';
import { CrowdfundingCreatePayload } from '../payloads/crowdfunding.create.payload';

@Injectable()
@Controller('crowdfunding')
export class CrowdfundingController {
  constructor(
    private readonly crowdfundingService: CrowdfundingService
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createCrowdfunding(
    @Body() payload: CrowdfundingCreatePayload,
    @CurrentUser() user: PerformerDto
  ): Promise<DataResponse<CrowdfundingDto>> {
    const post = await this.crowdfundingService.createCrowdfunding(payload, user);
    return DataResponse.ok(post);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async listCrowdfunding(
    @Body() payload: CrowdfundingSearchPayload,
    @CurrentUser() user: PerformerDto
  ): Promise<DataResponse<PageableData<CrowdfundingDto>>> {
    const searchPayload = payload;
    searchPayload.performerId = user._id;
    const list = await this.crowdfundingService.listCrowdfunding(payload);

    return DataResponse.ok(list);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  async getById(
    @Param('id') id: ObjectId,
    @CurrentUser() user: PerformerDto
  ): Promise<DataResponse<CrowdfundingDto>> {
    const crowdfunding = await this.crowdfundingService.getById(id, user);

    return DataResponse.ok(crowdfunding);
  }

  @Put('/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  async updateById(
    @Param('id') id: ObjectId,
    @Body() payload: CrowdfundingUpdatePayload
  ): Promise<any> {
    await this.crowdfundingService.updateById(id, payload);

    return DataResponse.ok({ success: true });
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  async deleteById(
    @Param('id') id: ObjectId,
    @CurrentUser() user: PerformerDto
  ): Promise<DataResponse<any>> {
    const resp = await this.crowdfundingService.deleteById(id, user);

    return DataResponse.ok(resp);
  }

  @Get('/user/search')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({
    transform: true,
    whitelist: true
  }))
  async userGetCrowdfunding(
    @Query() payload: CrowdfundingSearchPayload
  ): Promise<DataResponse<PageableData<CrowdfundingDto>>> {
    const list = await this.crowdfundingService.userGetCrowdfunding(payload);

    return DataResponse.ok(list);
  }
}
