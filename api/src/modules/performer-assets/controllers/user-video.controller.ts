import {
  Controller,
  Injectable,
  Post,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
  UsePipes,
  UseInterceptors,
  Request,
  Res,
  UnauthorizedException,
  ForbiddenException
} from '@nestjs/common';
import { Response, Request as Req } from 'express';
import { DataResponse } from 'src/kernel';
import { UserInterceptor } from 'src/modules/auth/interceptors';
import { AuthService } from 'src/modules/auth/services';
import { CurrentUser } from 'src/modules/auth/decorators';
import { UserDto } from 'src/modules/user/dtos';
import { AuthGuard, RoleGuard } from 'src/modules/auth/guards';
import { VideoService } from '../services/video.service';
import { VideoSearchRequest } from '../payloads';
import { VideoSearchService } from '../services/video-search.service';

const fs = require('fs');

@Injectable()
@Controller('user/performer-assets/videos')
export class UserVideosController {
  constructor(
    private readonly videoService: VideoService,
    private readonly videoSearchService: VideoSearchService,
    private readonly authService: AuthService
  ) { }

  @Get('/search')
  @UseInterceptors(UserInterceptor)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async search(
    @Query() req: VideoSearchRequest,
    @CurrentUser() user: UserDto,
    @Request() request: any
  ) {
    const auth = request.authUser && { _id: request.authUser.authId, source: request.authUser.source, sourceId: request.authUser.sourceId };
    const jwToken = request.authUser && this.authService.generateJWT(auth, { expiresIn: 2 * 60 * 60 });
    const resp = await this.videoSearchService.userSearch(req, user, jwToken);
    return DataResponse.ok(resp);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(UserInterceptor)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async details(
    @Param('id') id: string,
    @CurrentUser() user: UserDto,
    @Request() req: any
  ) {
    const auth = req.authUser && { _id: req.authUser.authId, source: req.authUser.source, sourceId: req.authUser.sourceId };
    const jwToken = req.authUser && this.authService.generateJWT(auth, { expiresIn: 2 * 60 * 60 });
    const details = await this.videoService.userGetDetails(id, user, jwToken);
    return DataResponse.ok(details);
  }

  @Post('/:id/inc-view')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async view(@Param('id') id: string) {
    const details = await this.videoService.increaseView(id);
    return DataResponse.ok(details);
  }

  @Get('/auth/check')
  @HttpCode(HttpStatus.OK)
  async checkAuth(
    @Request() request: Req,
    @Res() response: Response
  ) {
    if (!request.query.videoId) {
      return response.status(HttpStatus.UNAUTHORIZED).send();
    }

    const valid = await this.videoService.checkAuth(request);
    return response.status(valid ? HttpStatus.OK : HttpStatus.UNAUTHORIZED).send();
  }

  @Get('/download/:id')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async exportCsv(
    @Param('id') id: string,
    @Res() res: any,
    @Query('token') token: string
  ): Promise<any> {
    const auth = this.authService.decodeJWT(token);
    if (!auth) throw new UnauthorizedException();

    const video = await this.videoService.userGetDetails(id, { _id: auth.sourceId } as UserDto, token);

    if (video.isSaleVideo && !video.isBought) {
      throw new ForbiddenException();
    }

    res.setHeader('Content-disposition', `attachment; filename=${video.video.fileName || video.title}.${video.video.mineType.replace('video/', '')}`);
    res.header('Content-Type', video.video.mineType);
    const filestream = fs.createReadStream(video.video.absolutePath);
    filestream.pipe(res);
  }
}
