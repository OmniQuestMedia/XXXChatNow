import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  UseGuards,
  Body,
  Put,
  Param,
  ValidationPipe,
  UsePipes,
  Post
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { Roles } from 'src/modules/auth/decorators';
import { SettingService } from '../services';
import { SettingDto } from '../dtos';
import { RoleGuard } from '../../auth/guards';
import { SettingUpdatePayload } from '../payloads';

@Injectable()
@Controller('admin/settings')
export class AdminSettingController {
  constructor(private readonly settingService: SettingService) { }

  @Get('')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getAdminSettings(
    @Query('group') group: string
  ): Promise<DataResponse<SettingDto[]>> {
    const settings = await this.settingService.getEditableSettings(group);
    return DataResponse.ok(settings);
  }

  @Get('/:key')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getKeyValueSettings(
    @Param('key') key: string
  ): Promise<DataResponse<string>> {
    const value = await this.settingService.getKeyValue(key);
    return DataResponse.ok(value);
  }

  @Put('/:key')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(
    @Param('key') key: string,
    @Body() value: SettingUpdatePayload
  ): Promise<DataResponse<SettingDto>> {
    const data = await this.settingService.update(key, value);
    return DataResponse.ok(data);
  }

  @Post('/keys')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getValueByKeys(
    @Body('keys') keys: string[]
  ): Promise<DataResponse<Record<string, any>>> {
    if (!Array.isArray(keys)) return null;
    const data = await this.settingService.getValueByKeys(keys);
    return DataResponse.ok(data);
  }
}
