import {
  HttpCode,
  HttpStatus,
  Controller,
  Get,
  Injectable,
  UseGuards,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { RoleGuard } from 'src/modules/auth/guards';
import { Roles } from 'src/modules/auth/decorators';
import { StatisticService } from '../services';

@Injectable()
@Controller('admin/statistics')
export class AdminStatisticController {
  constructor(private readonly statisticService: StatisticService) { }

  @Get('/dashboard')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async list() {
    const stats = await this.statisticService.dashboardStats();
    return DataResponse.ok(stats);
  }
}
