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
import { PerformerDto } from 'src/modules/performer/dtos';
import { Parser } from 'json2csv';
import { EarningService } from '../services/earning.service';
import {
  EarningSearchRequestPayload
} from '../payloads';
import { UserDto } from '../../user/dtos';
import { EarningDto } from '../dtos/earning.dto';

@Injectable()
@Controller('earning')
export class PerformerEarningController {
  constructor(private readonly earningService: EarningService) { }

  @Get('/performer/search')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async search(
    @Query() req: EarningSearchRequestPayload,
    @CurrentUser() performer: UserDto
  ): Promise<DataResponse<PageableData<Partial<EarningDto>>>> {
    req.targetId = performer._id.toString();
    const data = await this.earningService.search(req);
    return DataResponse.ok(data);
  }

  @Get('/performer/stats')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async performerStats(
    @Query() req: EarningSearchRequestPayload,
    @CurrentUser() user: PerformerDto
  ): Promise<DataResponse<Record<string, any>>> {
    req.targetId = user._id.toString();
    const options = user.studioId ? {
      includingStudioEarning: true
    } : null;
    const data = await this.earningService.stats(req, options);
    return DataResponse.ok(data);
  }

  @Get('/performer/payout')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async performerPayout(
    @Query() req: EarningSearchRequestPayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<Record<string, any>>> {
    req.targetId = user._id.toString();
    const data = await this.earningService.calculatePayoutRequestStats(req);
    return DataResponse.ok(data);
  }

  @Get('/performer/pending')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getTotalPendingToken(
    @CurrentUser() currentUser: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = await this.earningService.getTotalPendingToken(
      currentUser._id
    );
    return DataResponse.ok(data);
  }

  @Get('/performer/export/csv')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async exportCsv(
    @Query() query: EarningSearchRequestPayload,
    @Query('fileName') nameFile: string,
    @Res() res: any,
    @CurrentUser() performer: PerformerDto
  ): Promise<any> {
    // eslint-disable-next-line no-param-reassign
    query.targetId = performer._id.toString();

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
        label: '% Model',
        value: 'commission'
      },
      {
        label: 'Tks Model',
        value: 'independentToken'
      },
      {
        label: 'Amt Model',
        value: 'independentAmount'
      }
    ];

    const { data } = await this.earningService.search(query);

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
