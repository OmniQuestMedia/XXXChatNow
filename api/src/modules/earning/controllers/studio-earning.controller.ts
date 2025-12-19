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
  Res
} from '@nestjs/common';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { StudioDto } from 'src/modules/studio/dtos';
import { Parser } from 'json2csv';
import { EarningService } from '../services/earning.service';
import {
  EarningSearchRequestPayload
} from '../payloads';
import { EarningDto } from '../dtos/earning.dto';

@Injectable()
@Controller('earning')
export class StudioEarningController {
  constructor(private readonly earningService: EarningService) { }

  @Get('/studio/search')
  @Roles('studio')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async studioSearch(
    @Query() req: EarningSearchRequestPayload,
    @CurrentUser() studio: StudioDto
  ): Promise<DataResponse<PageableData<Partial<EarningDto>>>> {
    req.targetId = studio._id.toString();
    const data = await this.earningService.search(req);
    return DataResponse.ok(data);
  }

  @Get('/studio/stats')
  @Roles('studio')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async studioStats(
    @Query() req: EarningSearchRequestPayload,
    @CurrentUser() studio: StudioDto
  ): Promise<DataResponse<any>> {
    req.targetId = studio._id.toString();
    const data = await this.earningService.stats(req, {
      includingStudioEarning: true
    });
    return DataResponse.ok(data);
  }

  @Get('/studio/payout')
  @Roles('studio')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async studioPayout(
    @Query() req: EarningSearchRequestPayload,
    @CurrentUser() studio: StudioDto
  ): Promise<DataResponse<any>> {
    req.targetId = studio._id.toString();
    const data = await this.earningService.calculatePayoutRequestStats(req);
    return DataResponse.ok(data);
  }

  @Get('/studio/export/csv')
  @Roles('studio')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async exportCsv(
    @Query() query: EarningSearchRequestPayload,
    @Query('fileName') nameFile: string,
    @Res() res: any,
    @CurrentUser() studio: StudioDto
  ): Promise<any> {
    // eslint-disable-next-line no-param-reassign
    query.targetId = studio._id.toString();

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
        label: '% Studio + Model Share',
        value: 'smPercent'
      },
      {
        label: 'Tks Studio + Model Share',
        value: 'smToken'
      },
      {
        label: 'Amt Studio + Model Share',
        value: 'smAmount'
      },
      {
        label: 'Payout form admin',
        value: 'payoutStatus'
      },
      {
        label: '% Studio Earnings',
        value: 'studioCommission'
      },
      {
        label: 'Tks Studio',
        value: 'studioToken'
      },
      {
        label: 'Amt Studio',
        value: 'independentStudio'
      },
      {
        label: '% Model Earnings',
        value: 'modelCommission'
      },
      {
        label: 'Tks Studio',
        value: 'modelToken'
      },
      {
        label: 'Amt Studio',
        value: 'independentModel'
      },
      {
        label: 'Payout to Model',
        value: 'modelStatus'
      }
    ];

    const { data } = await this.earningService.search(query);
    const newcommission = data.map((record) => ({
      ...record,
      tokenReceived: record.grossPrice.toFixed(2),

      adminCommission: 100 - record.commission,
      adminTks: (record.grossPrice - record.netPrice).toFixed(2),
      adminIndependentAmount: ((record.grossPrice - record.netPrice) * record.conversionRate).toFixed(2),

      smPercent: record.commission.toFixed(2),
      smToken: record.netPrice.toFixed(2),
      smAmount: record.price.toFixed(2),

      studioCommission: 100 - record.studioToModel.commission.toFixed(2),
      studioToken: (record.studioToModel.grossPrice - record.studioToModel.netPrice).toFixed(2),
      independentStudio: ((record.studioToModel.grossPrice - record.studioToModel.netPrice) * record.conversionRate).toFixed(2),

      modelCommission: record.studioToModel.commission.toFixed(2),
      modelToken: record.studioToModel.netPrice.toFixed(2),
      independentModel: ((record.studioToModel.netPrice) * record.conversionRate).toFixed(2),

      modelStatus: record.studioToModel.payoutStatus
    }));

    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(newcommission);
    res.header('Content-Type', 'text/csv');
    res.attachment(fileName);
    return res.send(csv);
  }
}
