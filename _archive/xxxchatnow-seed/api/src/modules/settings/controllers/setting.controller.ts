import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Get,
  Param,
  Body,
  Post
} from '@nestjs/common';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse } from 'src/kernel';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { PerformerCommissionService } from 'src/modules/performer/services';
import {
  PerformerCommissionDto,
  PerformerDto
} from 'src/modules/performer/dtos';
import { SettingService } from '../services';

@Injectable()
@Controller('settings')
export class SettingController {
  constructor(
    private readonly settingService: SettingService,
    private readonly performerCommission: PerformerCommissionService
  ) { }

  @Get('/public')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getPublicSettings(): Promise<DataResponse<Record<string, any>>> {
    const data = await this.settingService.getAutoloadPublicSettingsForUser();
    return DataResponse.ok(data);
  }

  @Get('/keys/:key')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getPublicValueByKey(
    @Param('key') key: string
  ): Promise<DataResponse<Record<string, any>>> {
    const data = await this.settingService.getPublicValueByKey(key);
    return DataResponse.ok(data);
  }

  @Post('/keys')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getPublicValueByKeys(
    @Body('keys') keys: string[]
  ): Promise<DataResponse<Record<string, any>>> {
    if (!Array.isArray(keys)) return null;
    const data = await this.settingService.getPublicValueByKeys(keys);
    return DataResponse.ok(data);
  }

  @Get('/performer/commission')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getPerformerCommission(
    @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<any>> {
    const performerCommission = await this.performerCommission.findOne({ performerId: performer._id });

    if (performerCommission) {
      return DataResponse.ok(new PerformerCommissionDto(performerCommission));
    }

    const defaultCommission = await this.settingService.getKeyValue(SETTING_KEYS.PERFORMER_COMMISSION);

    const commissionWheel = await this.settingService.getKeyValue(SETTING_KEYS.SPIN_WHEEL_COMMISSION);

    return DataResponse.ok({
      albumCommission: defaultCommission,
      groupCallCommission: defaultCommission,
      memberCommission: defaultCommission,
      privateCallCommission: defaultCommission,
      productCommission: defaultCommission,
      studioCommission: defaultCommission,
      tipCommission: defaultCommission,
      videoCommission: defaultCommission,
      spinWheelCommission: commissionWheel || defaultCommission
    });
  }
}
