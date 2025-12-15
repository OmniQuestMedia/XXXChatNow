import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Get,
  Query
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { Roles, CurrentUser } from 'src/modules/auth/decorators';
import { UserDto } from 'src/modules/user/dtos';
import { PaymentSearchService } from '../services';
import { PaymentSearchPayload } from '../payloads/payment-search.payload';
import { PerformerDto } from "src/modules/performer/dtos";

@Injectable()
@Controller('transactions')
export class PaymentSearchController {
  constructor(private readonly paymentService: PaymentSearchService) { }

  @Get('/admin/search')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async adminTranasctions(
    @Query() req: PaymentSearchPayload
  ): Promise<DataResponse<PageableData<any>>> {
    const data = await this.paymentService.adminGetUserTransactions(req);
    return DataResponse.ok(data);
  }

  @Get('/user/search')
  @HttpCode(HttpStatus.OK)
  @Roles('user')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async userTranasctions(
    @Query() req: PaymentSearchPayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<PageableData<any>>> {
    const data = await this.paymentService.getUserTransactions(req, user);
    return DataResponse.ok(data);
  }

  @Get('/performer/search')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async performerTranasctions(
    @Query() req: PaymentSearchPayload,
    @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<PageableData<any>>> {
    const data = await this.paymentService.getPerformerTransactions(req, performer);
    return DataResponse.ok(data);
  }
}
