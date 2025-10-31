import {
  HttpCode,
  HttpStatus,
  Controller,
  Get,
  Injectable
} from '@nestjs/common';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { DataResponse } from 'src/kernel';
import { CountryService } from '../services/country.service';
import { IpAddress } from '../decorators';
import { CurrencyConversionService } from '../services';
import { CURRENCY_INFO } from '../constants';

@Injectable()
@Controller('currency-conversion')
export class CurrencyConversionController {
  constructor(
    private readonly countryService: CountryService,
    private readonly currencyConversionService: CurrencyConversionService
  ) { }

  @Get('rate')
  @HttpCode(HttpStatus.OK)
  async getRateByIP(
    @IpAddress() ipAddress: string
  ) {
    const from = (SettingService.getValueByKey(`${SETTING_KEYS.CURRENCY_CONVERSTION_BASE_CURRENCY}`) || 'USD').toUpperCase();
    const defaultData = {
      from,
      to: from,
      rate: 1,
      symbol: '$'
    };
    try {
      const userCountry = await this.countryService.findCountryByIP(ipAddress);
      if (!userCountry?.countryCode) {
        return DataResponse.ok(defaultData);
      }

      const { countryCode } = userCountry;
      const currencyCode = CurrencyConversionService.getCurrencyCodeByCountryCode(countryCode);
      const data = await this.currencyConversionService.getRate(currencyCode);
      return DataResponse.ok({
        ...data,
        symbol: CURRENCY_INFO[currencyCode.toUpperCase()]?.symbolNative || '$'
      });
    } catch {
      return DataResponse.ok(defaultData);
    }
  }
}
