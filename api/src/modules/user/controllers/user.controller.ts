import {
  HttpCode,
  HttpStatus,
  Controller,
  Get,
  Injectable,
  UseGuards,
  Request,
  Body,
  Put,
  Post,
  UsePipes,
  ValidationPipe,
  HttpException,
  Query,
  Res,
  Param
} from '@nestjs/common';
import { Request as Req } from 'express';
import { AuthGuard, RoleGuard } from 'src/modules/auth/guards';
import { AuthService } from 'src/modules/auth/services';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { DataResponse, PageableData } from 'src/kernel';
import { AccountNotFoundxception } from 'src/modules/user/exceptions';
import { PasswordIncorrectException } from 'src/modules/auth/exceptions';
import { VideoService } from 'src/modules/performer-assets/services';
import { UserSearchService, UserService } from '../services';
import { UserDto, IUserResponse } from '../dtos';
import { UserSearchRequestPayload, UserUpdatePayload } from '../payloads';
import { STATUS_ACTIVE } from '../constants';
import { RRRPointsService, RRRAccountLinkService } from 'src/modules/loyalty-points/services';

const fs = require('fs');

@Injectable()
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly userSearchService: UserSearchService,
    private readonly videoService: VideoService,
    private readonly rrrPointsService: RRRPointsService,
    private readonly rrrAccountLinkService: RRRAccountLinkService
  ) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  // @UseGuards(AuthGuard)
  async me(@Request() request: Req): Promise<DataResponse<Partial<UserDto>>> {
    const jwtToken = request.headers.authorization;
    const user = await this.authService.getSourceFromJWT(jwtToken);
    if (!user || user.status !== STATUS_ACTIVE) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const result = await this.userService.findById(user._id);
    const userResponse = new UserDto(result).toResponse(true);
    
    // Enhance response with RRR points data (non-blocking)
    try {
      const linkStatus = await this.rrrAccountLinkService.getLinkStatus(user._id);
      const wallet = linkStatus.linked ? await this.rrrPointsService.getUserWallet(user._id) : null;
      
      (userResponse as any).rrr = {
        linked: linkStatus.linked,
        link_type: linkStatus.link_type,
        linked_at: linkStatus.linked_at,
        wallet: wallet ? {
          available_points: wallet.available_points,
          pending_points: wallet.pending_points,
          escrow_points: wallet.escrow_points,
          expiring_soon: wallet.expiring_soon
        } : null
      };
    } catch (error) {
      // If RRR is down, just set linked to false and continue
      (userResponse as any).rrr = {
        linked: false,
        available: false,
        error: 'RedRoomRewards temporarily unavailable'
      };
    }
    
    return DataResponse.ok(userResponse);
  }

  @Put()
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateMe(
    @CurrentUser() currentUser: UserDto,
    @Body() payload: UserUpdatePayload
  ): Promise<DataResponse<Partial<UserDto>>> {
    await this.userService.selfUpdate(currentUser._id, payload);

    const user = await this.userService.findById(currentUser._id);
    return DataResponse.ok(new UserDto(user).toResponse(true));
  }

  @Get('/shipping-info')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async getShippingInfo(@CurrentUser() user: UserDto): Promise<any> {
    const data = await this.userService.getShippingInfo(user._id);
    return DataResponse.ok(data);
  }

  @Post('/suspend-account')
  @HttpCode(HttpStatus.OK)
  @Roles('user')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async suspendAccount(
    @CurrentUser() currentUser: UserDto,
    @Body('password') password: string
  ): Promise<DataResponse<any>> {
    const auth = await this.authService.findBySource({
      sourceId: currentUser._id
    });
    if (!auth) {
      throw new AccountNotFoundxception();
    }
    if (!this.authService.verifyPassword(password, auth)) {
      throw new PasswordIncorrectException();
    }

    await this.userService.selfSuspendAccount(
      currentUser._id
    );
    return DataResponse.ok({ success: true });
  }

  @Get('/search')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async search(
    @Query() req: UserSearchRequestPayload
  ): Promise<DataResponse<PageableData<IUserResponse>>> {
    return DataResponse.ok(await this.userSearchService.search(req));
  }

  @Get('/download/video/:id')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async exportCsv(
    @Param('id') id: string,
    @Res() res: any,
    @Request() req: any,
    @CurrentUser() user: UserDto
  ): Promise<any> {
    const auth = req.authUser && { _id: req.authUser.authId, source: req.authUser.source, sourceId: req.authUser.sourceId };
    const jwToken = req.authUser && this.authService.generateJWT(auth, { expiresIn: 2 * 60 * 60 });
    const video = await this.videoService.userGetDetails(id, user, jwToken);

    res.header('Content-Type', video.video.mineType);
    const filestream = fs.createReadStream(video.video.absolutePath);
    filestream.pipe(res);
  }
}
