import {
  Controller,
  Injectable,
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Put
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse } from 'src/kernel';
import { Roles } from 'src/modules/auth/decorators';
import { toObjectId } from 'src/kernel/helpers/string.helper';
import { AdminPerformerCommissionPayload } from '../payloads';
import { PerformerCommissionDto } from '../dtos';
import { PerformerCommissionService } from '../services/performer-commission.service';

@Injectable()
@Controller('admin/performer-commission')
export class AdminPerformerCommissionController {
  constructor(
    private readonly performerCommissionService: PerformerCommissionService
  ) { }

  @Put('/update')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(
    @Body() payload: AdminPerformerCommissionPayload
  ): Promise<DataResponse<PerformerCommissionDto>> {
    const data = await this.performerCommissionService.update(
      toObjectId(payload.performerId),
      payload
    );
    return DataResponse.ok(new PerformerCommissionDto(data));
  }
}
