/* eslint-disable camelcase */
import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Post,
  Body,
  Query
} from '@nestjs/common';
import { DataResponse, ForbiddenException } from 'src/kernel';
import { IpAddress } from 'src/modules/utils/decorators';
import { isValidCCBillIP } from 'src/modules/utils/services/utils.service';
import { PaymentService } from '../services/payment.service';

@Injectable()
@Controller('payment')
export class PaymentWebhookController {
  constructor(
    private readonly paymentService: PaymentService
  ) { }

  @Post('/ccbill/callhook')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async ccbillCallhook(
    @Body() payload: Record<string, string>,
    @Query() req: Record<string, string>,
    @IpAddress() ipAddress: string
  ): Promise<DataResponse<any>> {
    // check whitelist IP of ccbill in production env
    if (process.env.NODE_ENV === 'production' && !isValidCCBillIP(ipAddress)) {
      throw new ForbiddenException('Invalid request IP!');
    }

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
