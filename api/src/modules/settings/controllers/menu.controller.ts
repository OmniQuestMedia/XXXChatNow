import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Get
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { MenuService } from '../services';
import { MenuDto } from '../dtos';

@Injectable()
@Controller('menus')
export class MenuController {
  constructor(
    private readonly menuService: MenuService
  ) { }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async all(): Promise<DataResponse<Partial<MenuDto>[]>> {
    const menu = await this.menuService.getAllActiveMenus();
    return DataResponse.ok(menu);
  }
}
