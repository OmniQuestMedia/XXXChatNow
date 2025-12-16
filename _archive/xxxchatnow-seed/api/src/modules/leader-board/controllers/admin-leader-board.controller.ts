import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Injectable, Param, Post, Put, UseGuards, UsePipes, ValidationPipe
} from '@nestjs/common';
import { Roles } from 'src/modules/auth/decorators';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { AdminSearchLeaderBoardPayload, LeaderBoardCreatePayload } from '../payloads';
import { LeaderBoardDto } from '../dtos';
import { AdminLeaderBoardService } from '../services';

@Injectable()
@Controller('admin/leader-board')
export class AdminLeaderBoardController {
  constructor(
    private readonly adminLeaderBoardService: AdminLeaderBoardService
  ) { }

  @Post('')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createLeaderBoard(
    @Body() payload: LeaderBoardCreatePayload
  ): Promise<DataResponse<LeaderBoardDto>> {
    const leaderBoard = await this.adminLeaderBoardService.create(payload);
    return DataResponse.ok(leaderBoard);
  }

  @Get('/search')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async find(
    @Body() payload: AdminSearchLeaderBoardPayload
  ): Promise<DataResponse<PageableData<LeaderBoardDto>>> {
    const results = await this.adminLeaderBoardService.find(payload);
    return DataResponse.ok(results);
  }

  @Get('/search/view/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async findOne(
    @Param('id') id: any
  ): Promise<DataResponse<LeaderBoardDto>> {
    const leaderBoard = await this.adminLeaderBoardService.findOne(id);
    return DataResponse.ok(new LeaderBoardDto(leaderBoard));
  }

  @Put('/update/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateOne(
    @Param('id') id: any,
    @Body() payload: any
  ): Promise<DataResponse<PageableData<LeaderBoardDto>>> {
    const leaderBoard = await this.adminLeaderBoardService.updateOne(id, payload);
    return DataResponse.ok(leaderBoard);
  }

  @Delete('/delete/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async deleteOne(
    @Param('id') id: any
  ): Promise<DataResponse<boolean>> {
    const result = await this.adminLeaderBoardService.deleteOne(id);
    return DataResponse.ok(result);
  }
}
