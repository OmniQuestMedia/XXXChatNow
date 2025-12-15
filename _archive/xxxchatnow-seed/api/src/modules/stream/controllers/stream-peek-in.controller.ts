import {
  Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { UserDto } from 'src/modules/user/dtos';
import { RoleGuard } from 'src/modules/auth/guards';
import { StreamPeekInService } from '../services';

@Controller('/streaming/private/peek-in')
export class StreamPeekInController {
  constructor(
    private readonly streamPeekInService: StreamPeekInService
  ) {}

  @Post('/:id')
  @UseGuards(RoleGuard)
  @Roles('user')
  @HttpCode(HttpStatus.OK)
  public async request(@Param('id') id: string, @CurrentUser() user:UserDto) {
    return DataResponse.ok(await this.streamPeekInService.request(id, user._id));
  }

  @Get('/:id')
  @UseGuards(RoleGuard)
  @Roles('user')
  @HttpCode(HttpStatus.OK)
  public async getDetails(@Param('id') id: string, @CurrentUser() user:UserDto) {
    return DataResponse.ok(await this.streamPeekInService.getDetails(id, user._id));
  }
}
