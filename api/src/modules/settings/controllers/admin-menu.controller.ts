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
  Put,
  Param,
  Delete,
  Get,
  Query
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { UserDto } from 'src/modules/user/dtos';
import { MenuService } from '../services';
import {
  MenuCreatePayload,
  MenuUpdatePayload,
  MenuSearchRequestPayload
} from '../payloads';
import { MenuDto } from '../dtos';

@Injectable()
@Controller('admin/menus')
export class AdminMenuController {
  constructor(
    private readonly menuService: MenuService
  ) { }

  @Post('/')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(
    @Body() payload: MenuCreatePayload
  ): Promise<DataResponse<MenuDto>> {
    const menu = await this.menuService.create(payload);
    return DataResponse.ok(menu);
  }

  @Put('/:id')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserDto,
    @Body() payload: MenuUpdatePayload
  ): Promise<DataResponse<MenuDto>> {
    const menu = await this.menuService.update(id, payload);
    return DataResponse.ok(menu);
  }

  @Delete('/:id')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async delete(@Param('id') id: string): Promise<DataResponse<boolean>> {
    const deleted = await this.menuService.delete(id);
    return DataResponse.ok(deleted);
  }

  @Get('/search')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async search(
    @Query() req: MenuSearchRequestPayload
  ): Promise<DataResponse<PageableData<any>>> {
    const menu = await this.menuService.search(req);
    return DataResponse.ok(menu);
  }

  @Get('/:id/view')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async details(@Param('id') id: string): Promise<DataResponse<any>> {
    const menu = await this.menuService.findById(id);
    return DataResponse.ok(menu);
  }
}
