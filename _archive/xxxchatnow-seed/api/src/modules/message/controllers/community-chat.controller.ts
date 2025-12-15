import { AuthGuard } from 'src/modules/auth/guards';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Injectable,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { CurrentUser } from 'src/modules/auth/decorators';
import { PerformerDto } from 'src/modules/performer/dtos';
import { DataResponse, PageableData } from 'src/kernel';
import { UserDto } from 'src/modules/user/dtos';
import { CommunityChatService } from '../services/community-chat.service';
import { CommunityChatPayload, CommunityChatSearchPayload } from '../payloads';

@Injectable()
@Controller('community-chat')
export class CommunityChatController {
  constructor(private readonly communityChatService: CommunityChatService) {}

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getList(
    @Query() request: CommunityChatSearchPayload,
    @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<PageableData<any>>> {
    const items = await this.communityChatService.getList(request, performer);
    return DataResponse.ok(items);
  }

  @Get('/channel/list')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getUserList(
    @Query() request: CommunityChatSearchPayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<PageableData<any>>> {
    const items = await this.communityChatService.getUserList(request, user);
    return DataResponse.ok(items);
  }

  @Get('/channel/search')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async search(
    @Query() request: CommunityChatSearchPayload
  ): Promise<DataResponse<PageableData<any>>> {
    const items = await this.communityChatService.search(request);
    return DataResponse.ok(items);
  }

  @Post('/create')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createGroup(
    @Body() payload: CommunityChatPayload,
    @CurrentUser() performer: PerformerDto
  ) {
    const resp = await this.communityChatService.createGroup(
      payload,
      performer
    );
    return DataResponse.ok(resp);
  }

  @Delete('/delete/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async deleteGroup(@Param('id') groupId: any) {
    const resp = await this.communityChatService.deleteGroup(groupId);
    return DataResponse.ok(resp);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getGroupId (
    @Param('id') groupId: string
  ) {
    const resp = await this.communityChatService.getGroupId(groupId);

    return DataResponse.ok(resp)
  }

  @Post('/join/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async joinConversation(
    @Param('id') conversationId: string,
    @CurrentUser() user: any
  ) {
    const resp = await this.communityChatService.joinConversation(
      conversationId,
      user
    );
    return DataResponse.ok(resp);
  }

  @Put('/leave/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async userLeaveTheConversation(
    @Param('id') conversationId: string,
    @CurrentUser() user: any
  ) {
    const resp = await this.communityChatService.userLeaveTheConversation(
      conversationId,
      user
    );
    return DataResponse.ok(resp);
  }

  @Get('/channel/:id/members')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async listParticipant(
    @Param('id') conversationId: string
  ) {
    const resp = await this.communityChatService.listParticipant(
      conversationId
    );
    return DataResponse.ok(resp);
  }
}
