import {
  Body, Controller, Delete, Get, HttpCode,
  HttpStatus, Param, Post, Put, Query, UseGuards,
  UsePipes, ValidationPipe
} from '@nestjs/common';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { RoleGuard } from 'src/modules/auth/guards';
import {
  DataResponse,
  PageableData
} from 'src/kernel';
import { PerformerDto } from 'src/modules/performer/dtos';
// import { STATUS } from 'src/kernel/constants';
import { PerformerScheduleService } from '../services';
import {
  PerformerScheduleCreatePayload,
  PerformerScheduleSearchPayload,
  PerformerScheduleUpdatePayload
} from '../payloads';
import { PerformerScheduleDto } from '../dtos';

@Controller('performer-schedule')
export class PerformerScheduleController {
  constructor(
        private readonly performerScheduleService: PerformerScheduleService
  ) { }

    @Post('/')
    @Roles('performer')
    @UseGuards(RoleGuard)
    @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async create(
        @Body() payload: PerformerScheduleCreatePayload,
        @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<PerformerScheduleDto>> {
    const result = await this.performerScheduleService.create(payload, performer);
    return DataResponse.ok(result);
  }

    @Get('/search')
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({ transform: true }))
    async userSearch(
        @Query() req: PerformerScheduleSearchPayload
    ): Promise<DataResponse<PageableData<PerformerScheduleDto>>> {
      const data = await this.performerScheduleService.search({ ...req });
      return DataResponse.ok(data);
    }

    @Get('')
    @Roles('performer')
    @UseGuards(RoleGuard)
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({ transform: true }))
    async search(
        @Query() query: PerformerScheduleSearchPayload,
        @CurrentUser() performer: PerformerDto
    ): Promise<DataResponse<PageableData<PerformerScheduleDto>>> {
      const req = { ...query, performerId: performer._id };
      const data = await this.performerScheduleService.search(req);
      return DataResponse.ok(data);
    }

    @Get('/:id/view')
    @UsePipes(new ValidationPipe({ transform: true }))
    async details(
        @Param('id') id: string
    ): Promise<DataResponse<PerformerScheduleDto>> {
      const result = await this.performerScheduleService.findOne(id);
      return DataResponse.ok(result);
    }

    @Put('/:id')
    @Roles('performer')
    @UseGuards(RoleGuard)
    @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
    async update(
        @Param('id') id: string,
        @Body() payload: PerformerScheduleUpdatePayload,
        @CurrentUser() performer: PerformerDto
    ): Promise<DataResponse<PerformerScheduleDto>> {
      const result = await this.performerScheduleService.update(id, payload, performer);
      return DataResponse.ok(result);
    }

    @Delete('/:id')
    @Roles('performer')
    @UseGuards(RoleGuard)
    @UsePipes(new ValidationPipe({ transform: true }))
    async delete(
        @Param('id') id: string,
        @CurrentUser() performer: PerformerDto
    ) {
      const result = await this.performerScheduleService.delete(id, performer);
      return DataResponse.ok(result);
    }
}
