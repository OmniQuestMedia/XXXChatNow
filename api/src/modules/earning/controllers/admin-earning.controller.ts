import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Get,
  UseGuards,
  Query,
  Param,
  Res
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { Parser } from 'json2csv';
import { EarningService } from '../services/earning.service';

import {
  EarningSearchRequestPayload
} from '../payloads';
import {
  EarningDto
} from '../dtos/earning.dto';
import { UserDto } from '../../user/dtos';

@Injectable()
@Controller('admin/earning')
export class AdminEarningController {
  constructor(private readonly earningService: EarningService) { }

  @Get('/search')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async adminSearch(
    @Query() req: EarningSearchRequestPayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<PageableData<Partial<EarningDto>>>> {
    const data = await this.earningService.search(req, user);
    return DataResponse.ok(data);
  }

  @Get('/stats')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async adminStats(
    @Query() req: EarningSearchRequestPayload
  ): Promise<DataResponse<any>> {
    const data = await this.earningService.adminStats(req);
    return DataResponse.ok(data);
  }

  @Get('/:id')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async details(@Param('id') id: string): Promise<DataResponse<EarningDto>> {
    const data = await this.earningService.details(id);
    return DataResponse.ok(data);
  }

  @Get('/export/csv')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async exportCsv(
    @Query() query: EarningSearchRequestPayload,
    @Query('fileName') nameFile: string,
    @Res() res: any
  ): Promise<any> {
    const fileName = nameFile || 'earnings_export.csv';
    const fields = [
      {
        label: 'Reference',
        value: 'transactionTokenId'
      },
      {
        label: 'Date',
        value: 'createdAt'
      },
      {
        label: 'Form',
        value: 'sourceInfo.username'
      },
      {
        label: 'To',
        value: 'targetInfo.username'
      },
      {
        label: 'Transaction Type',
        value: 'type'
      },
      {
        label: 'Tokens Received',
        value: 'tokenReceived'
      },
      {
        label: 'Conversion Rate',
        value: 'conversionRate'
      },
      {
        label: '% Admin',
        value: 'adminCommission'
      },
      {
        label: 'Tks Admin',
        value: 'adminTks'
      },
      {
        label: 'Amt Admin',
        value: 'adminIndependentAmount'
      },
      {
        label: query.target === 'perfromer' ? '% Model' : '% Studio',
        value: 'commission'
      },
      {
        label: query.target === 'perfromer' ? 'Tks Model' : 'Tks Studio',
        value: 'independentToken'
      },
      {
        label: query.target === 'perfromer' ? 'Amt Model' : 'Amt Studio',
        value: 'independentAmount'
      },
      {
        label: 'Payout Status',
        value: 'payoutStatus'
      }
    ];
    const { data } = await this.earningService.search({
      ...query,
      limit: 9999
    });

    const newcommission = data.map((record) => ({
      ...record,
      adminCommission: 100 - record.commission,
      adminTks: (record.grossPrice - record.netPrice).toFixed(2),
      adminIndependentAmount: ((record.grossPrice - record.netPrice) * record.conversionRate).toFixed(2),
      independentToken: record.netPrice.toFixed(2),
      independentAmount: record.price.toFixed(2),
      tokenReceived: record.grossPrice.toFixed(2)
    }));

    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(newcommission);
    res.header('Content-Type', 'text/csv');
    res.attachment(fileName);
    return res.send(csv);
  }
}
