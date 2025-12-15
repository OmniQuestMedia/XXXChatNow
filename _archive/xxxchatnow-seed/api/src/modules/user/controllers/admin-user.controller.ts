import {
  HttpCode,
  HttpStatus,
  Controller,
  Get,
  Injectable,
  UseGuards,
  Body,
  Put,
  Query,
  ValidationPipe,
  UsePipes,
  Param,
  Post,
  Res,
  HttpException
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { PageableData } from 'src/kernel/common';
import { DataResponse } from 'src/kernel';
import { AuthService } from 'src/modules/auth/services';
import { Parser } from 'json2csv';
import {
  UserSearchRequestPayload,
  UserAuthCreatePayload,
  UserAuthUpdatePayload
} from '../payloads';

import { UserDto } from '../dtos';
import { UserService, UserSearchService } from '../services';

@Injectable()
@Controller('admin/users')
export class AdminUserController {
  constructor(
    private readonly userService: UserService,
    private readonly userSearchService: UserSearchService,
    private readonly authService: AuthService
  ) { }

  @Get('/search')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async search(
    @Query() req: UserSearchRequestPayload
  ): Promise<DataResponse<PageableData<Partial<UserDto>>>> {
    return DataResponse.ok(await this.userSearchService.search(req));
  }

  @Post('/')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createUser(
    @Body() payload: UserAuthCreatePayload
  ): Promise<DataResponse<Partial<UserDto>>> {
    const user = await this.userService.create(payload, {
      roles: payload.roles,
      emailVerified: payload.emailVerified,
      status: payload.status
    });

    if (payload.password) {
      // generate auth if have pw, otherwise will create random and send to user email?
      await this.authService.createAuthPassword({
        value: payload.password,
        source: 'user',
        key: payload.email,
        sourceId: user._id
      });
    }

    return DataResponse.ok(new UserDto(user).toResponse(true));
  }

  @Put('/')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateMe(
    @Body() payload: UserAuthUpdatePayload,
    @CurrentUser() currentUser: UserDto
  ): Promise<DataResponse<Partial<UserDto>>> {
    await this.userService.adminUpdate(currentUser._id, payload);

    const user = await this.userService.findById(currentUser._id);
    return DataResponse.ok(new UserDto(user).toResponse(true));
  }

  @Put('/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateUser(
    @Body() payload: UserAuthUpdatePayload,
    @Param('id') id: string
  ): Promise<DataResponse<Partial<UserDto>>> {
    await this.userService.adminUpdate(id, payload);

    const user = await this.userService.findById(id);
    return DataResponse.ok(new UserDto(user).toResponse(true));
  }

  @Get('/:id/view')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  async getDetails(
    @Param('id') id: string
  ): Promise<DataResponse<Partial<UserDto>>> {
    const user = await this.userService.findById(id);
    
    // TODO - check roles or other to response info
    return DataResponse.ok(new UserDto(user).toResponse(true));
  }

  @Get('/export/csv')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async exportCsv(
    @Query() query: UserSearchRequestPayload,
    @Query('fileName') nameFile: string,
    @Res() res: any
  ): Promise<any> {
    const fileName = nameFile || 'users_export.csv';
    const fields = [
      {
        label: 'username',
        value: 'username'
      },
      {
        label: 'Email',
        value: 'email'
      },
      {
        label: 'Phone',
        value: 'phone'
      },
      {
        label: 'Status',
        value: 'status'
      },
      {
        label: 'Gender',
        value: 'gender'
      },
      {
        label: 'Country',
        value: 'country'
      },
      {
        label: 'Balance',
        value: 'balance'
      }
    ];
    const { data } = await this.userSearchService.search({
      ...query,
      limit: 9999
    });
    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(data);
    res.header('Content-Type', 'text/csv');
    res.attachment(fileName);
    return res.send(csv);
  }

  @Get('/stats')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async stats() {
    const results = await this.userService.stats();
    return DataResponse.ok(results);
  }

  @Post('/2fa/turn-on-off')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  async turnOnTwoFactorAuthentication(
    @CurrentUser() user: UserDto,
    @Body() payload: any
  ): Promise<DataResponse<any>> {
    const isCodeValid = await this.userService.isTwoFactorAuthenticationCodeValid(
      payload.twoFactorAuthenticationCode,
      user
    );
    if (!isCodeValid) {
      throw new HttpException('Wrong authentication code', 400);
    }

    const data = await this.userService.turnOnOffTwoFactorAuthentication(user._id);

    return DataResponse.ok(data);
  }
}
