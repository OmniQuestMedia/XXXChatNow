import {
  HttpCode, HttpStatus, Controller, Get, Query, Param, Put, Body, UseGuards
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { Roles } from 'src/modules/auth/decorators';
import { RoleGuard } from 'src/modules/auth/guards';
import { CamAggregatorService } from '../services/cam-aggregator.service';

@Controller('cam-aggregator')
export class CamAggregatorController {
  constructor(private readonly service: CamAggregatorService) {}

  @Get('online')
  @HttpCode(HttpStatus.OK)
  public async onlineList(
    @Query() req: any
  ): Promise<any> {
    const data = await this.service.listOnline(req);
    return DataResponse.ok(data);
  }

  @Get('categories')
  @HttpCode(HttpStatus.OK)
  public async getActiveCategories(): Promise<any> {
    const data = await this.service.getCategories({
      active: true
    });
    return DataResponse.ok(data);
  }

  @Get('admin/categories')
  @HttpCode(HttpStatus.OK)
  public async getAllCategories(): Promise<any> {
    const data = await this.service.getCategories({});
    return DataResponse.ok(data);
  }

  @Get('admin/categories/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  public async getCategory(
    @Param('id') id: string
  ): Promise<any> {
    const data = await this.service.getCategory(id);
    return DataResponse.ok(data);
  }

  @Get('user/categories/:id')
  @HttpCode(HttpStatus.OK)
  public async findOne(
    @Param('id') id: string
  ): Promise<any> {
    const data = await this.service.getCategoryByAlias(id);
    return DataResponse.ok(data);
  }

  @Put('admin/categories/:id')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  public async updateCategory(
    @Param('id') id: string,
    @Body() payload: any
  ): Promise<any> {
    const data = await this.service.updateCategory(id, payload);
    return DataResponse.ok(data);
  }

  @Get('profile/:key/:username')
  @HttpCode(HttpStatus.OK)
  public async getDetails(
    // x - xlovecams
    // b - bongacams
    // s - stripcash
    // c - chaturbate
    @Param('key') key: string,
    @Param('username') username: string
  ): Promise<any> {
    const data = await this.service.getDetails(key, username);
    return DataResponse.ok(data);
  }

  @Get('profile/:username')
  @HttpCode(HttpStatus.OK)
  public async getDetails2(
    @Param('username') username: string
  ): Promise<any> {
    const data = await this.service.getDetails(null, username);
    return DataResponse.ok(data);
  }

  @Get('/:username/related')
  @HttpCode(HttpStatus.OK)
  public async getRelatedCams(
    @Param('username') username: string,
    @Query() query: any
  ): Promise<any> {
    const data = await this.service.getRelatedCams(username, query);
    return DataResponse.ok(data);
  }
}
