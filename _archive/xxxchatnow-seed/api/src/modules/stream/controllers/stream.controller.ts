import {
  Controller,
  Injectable,
  UseGuards,
  Body,
  Post,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Get,
  Param
} from '@nestjs/common';
import { RoleGuard, AuthGuard } from 'src/modules/auth/guards';
import { DataResponse } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { PerformerDto } from 'src/modules/performer/dtos';
import { UserDto } from 'src/modules/user/dtos';
import { StreamService } from '../services/stream.service';
import { StreamPayload, TokenCreatePayload } from '../payloads';
import { TokenResponse } from '../constant';

@Injectable()
@Controller('streaming')
export class StreamController {
  constructor(private readonly streamService: StreamService) { }

  @Get('/session/:type')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getSessionId(
    @CurrentUser() performer: PerformerDto,
    @Param() param: StreamPayload
  ): Promise<DataResponse<string>> {
    const sessionId = await this.streamService.getSessionId(
      performer._id,
      param.type
    );

    return DataResponse.ok(sessionId);
  }

  @Get('/session/:id/:type')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getPerformerSessionId(
    @Param() params: StreamPayload
  ): Promise<DataResponse<string>> {
    const sessionId = await this.streamService.getSessionId(
      params.id,
      params.type
    );

    return DataResponse.ok(sessionId);
  }

  @Post('/live')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async goLive(@CurrentUser() performer: PerformerDto) {
    const data = await this.streamService.goLive(performer._id);
    return DataResponse.ok(data);
  }

  @Post('/join/:id')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async join(@Param('id') performerId: string, @CurrentUser() currentUser: any) {
    const data = await this.streamService.joinPublicChat(performerId, currentUser);
    return DataResponse.ok(data);
  }

  @Post('/private-chat/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async requestPrivateChat(
    @Param('id') performerId: string,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.streamService.requestPrivateChat(
      user,
      performerId
    );

    return DataResponse.ok(data);
  }

  @Get('/private-chat/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async accpetPrivateChat(
    @Param('id') id: string,
    @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = await this.streamService.accpetPrivateChat(
      id,
      performer._id
    );

    return DataResponse.ok(data);
  }

  @Get('/group-chat/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async joinGroupChat(
    @Param('id') id: string,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.streamService.joinGroupChat(id, user);

    return DataResponse.ok(data);
  }

  @Post('/group-chat')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async startGroupChat(
    @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = await this.streamService.startGroupChat(performer._id);

    return DataResponse.ok(data);
  }

  @Post('/token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getOneTimeToken(
    @CurrentUser() user: UserDto,
    @Body() payload: TokenCreatePayload
  ): Promise<DataResponse<TokenResponse>> {
    const result = await this.streamService.getOneTimeToken(payload, user._id.toString());
    return DataResponse.ok(result);
  }

  @Get('/broadcast/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  public async getStream(@Param('id') id: string) {
    return DataResponse.ok(await this.streamService.getStream(id));
  }

  @Get('/public/:performerId')
  @HttpCode(HttpStatus.OK)
  // @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getPublicStream(
    @Param('performerId') performerId: string
    // @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.streamService.getPublicStream(performerId);
    return DataResponse.ok(data);
  }
}
