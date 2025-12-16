import { Inject, Injectable } from '@nestjs/common';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { Model } from 'mongoose';
import { SettingService } from 'src/modules/settings';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { CURRENCY_CONVERSION_DB_PROVIDER } from '../providers/currency-conversion.provider';
import { CurrencyConversionModel } from '../models/currency-conversion.model';
import { COUNTRY_CURRENCY } from '../constants';

@Injectable()
export class CurrencyConversionService {
  constructor(
    @Inject(CURRENCY_CONVERSION_DB_PROVIDER)
    private readonly CurrencyConversion: Model<CurrencyConversionModel>,
    private readonly httpService: HttpService
  ) {}

  public static getCurrencyCodeByCountryCode(countryCode: string) {
    return COUNTRY_CURRENCY[countryCode] || 'USD';
  }

  public async getRate(toCurrency: string): Promise<any> {
    const apiEndpoint = await SettingService.getValueByKey(
      SETTING_KEYS.CURRENCY_CONVERSTION_API_ENDPOINT
    );
    const apiKey = await SettingService.getValueByKey(
      SETTING_KEYS.CURRENCY_CONVERSTION_API_KEY
    );
    const from = (await SettingService.getValueByKey(
      SETTING_KEYS.CURRENCY_CONVERSTION_BASE_CURRENCY
    ) || 'USD').toUpperCase();

    try {
      // Check cache first
      const cached = await this.CurrencyConversion.findOne({
        from,
        to: toCurrency,
        updatedAt: {
          $gt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      });

      if (cached) {
        return {
          from: cached.from,
          to: cached.to,
          rate: cached.rate
        };
      }
      // If not cached, fetch from API
      const response = await lastValueFrom(
        this.httpService.get(`${apiEndpoint}`, {
          params: {
            apikey: apiKey,
            base: from
          }
        })
      );

      const rate = response.data.rates[toCurrency];
      if (!rate) {
        throw new Error('Currency rate not found');
      }

      // Save to cache
      await this.CurrencyConversion.findOneAndUpdate(
        { from, to: toCurrency },
        {
          from,
          to: toCurrency,
          rate,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );

      return {
        from,
        to: toCurrency,
        rate
      };
    } catch (e) {
      // Return default rate 1 if API fails
      return {
        from,
        to: toCurrency,
        rate: 1
      };
    }
  }
}
