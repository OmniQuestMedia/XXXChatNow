import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Param,
  Get,
  Post,
  UseGuards,
  Body
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { PerformerDto } from 'src/modules/performer/dtos';
import { PayoutRequestCreatePayload } from '../payloads/payout-request.payload';
import { PayoutRequestService } from '../services/payout-request.service';

@Injectable()
@Controller('payout-requests/performer')
export class PayoutRequestController {
  constructor(private readonly payoutRequestService: PayoutRequestService) { }

  @Post('/')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(
    @Body() payload: PayoutRequestCreatePayload,
    @CurrentUser() user: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.create(payload, user);
    return DataResponse.ok(data);
  }

  // this function is disabled right now
  // @Put('/:id')
  // @HttpCode(HttpStatus.OK)
  // @Roles('performer')
  // @UseGuards(RoleGuard)
  // @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  // async update(
  //   @Param('id') id: string,
  //   @Body() payload: PayoutRequestCreatePayload,
  //   @CurrentUser() performer: PerformerDto
  // ): Promise<DataResponse<any>> {
  //   const data = await this.payoutRequestService.update(id, payload, performer);
  //   return DataResponse.ok(data);
  // }

  @Get('/:id/view')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async details(
    @Param('id') id: string,
    @CurrentUser() user: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.details(id, user);
    return DataResponse.ok(data);
  }

  @Post('/stats')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async stats(
    @CurrentUser() user: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.calculateStats(user._id);
    return DataResponse.ok(data);
  }

  @Get('/pending-requests')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getPendingRequests(
    @CurrentUser() user: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.getPendingRequests(user._id);
    return DataResponse.ok(data);
  }
}
