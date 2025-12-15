/* eslint-disable camelcase */
import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Post,
  Body,
  Query,
  Param
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { ObjectId } from 'mongodb';
import { PerformerDto } from 'src/modules/performer/dtos';
import { FeaturedCreatorPackageService } from 'src/modules/featured-creator/services';
import { UserDto } from '../../user/dtos';
import { PaymentService } from '../services/payment.service';
import { OrderService } from '../services/order.service';
import { BuyFeaturedCreatorPackagePayload } from '../payloads';

@Injectable()
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly orderService: OrderService,
    private readonly featuredCreatorPackageService: FeaturedCreatorPackageService
  ) {}

  @Post('/purchase-tokens/:tokenId')
  @HttpCode(HttpStatus.OK)
  @Roles('user')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async purchaseProducts(
    @CurrentUser() user: UserDto,
    @Param('tokenId') tokenId: string | ObjectId,
    @Body() payload: any
  ): Promise<DataResponse<any>> {
    const order = await this.orderService.createTokenOrderFromPayload(tokenId, user);
    const info = await this.paymentService.processSinglePayment(order, payload.gateway || 'ccbill');
    return DataResponse.ok(info);
  }

  @Post('/purchase-featured-creator/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async purchaseFeaturedCreatorPackage(
    @CurrentUser() performer: PerformerDto,
    @Param('id') packageId: string | ObjectId,
    @Body() payload: BuyFeaturedCreatorPackagePayload
  ): Promise<DataResponse<any>> {
    const resp = await this.featuredCreatorPackageService.performerBooking(packageId, performer, payload);
    return DataResponse.ok(resp);
  }

  @Post('/ccbill/callhook')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async ccbillCallhook(
    @Body() payload: Record<string, string>,
    @Query() req: Record<string, string>
  ): Promise<DataResponse<any>> {
    if (!['NewSaleSuccess', 'RenewalSuccess'].includes(req.eventType)) {
      return DataResponse.ok(false);
    }

    let info;
    const data = {
      ...payload,
      ...req
    };
    switch (req.eventType) {
      case 'RenewalSuccess':
        info = await this.paymentService.ccbillRenewalSuccessWebhook(data);
        break;
      default:
        info = await this.paymentService.ccbillSinglePaymentSuccessWebhook(
          data
        );
        break;
    }
    return DataResponse.ok(info);
  }
}
