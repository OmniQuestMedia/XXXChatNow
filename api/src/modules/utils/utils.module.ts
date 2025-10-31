import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongoDBModule } from 'src/kernel';
import {
  CountryService,
  LanguageService,
  PhoneCodeService,
  TimeZonesService
} from './services';
import {
  CountryController,
  LanguageController,
  PhoneCodeController,
  TimezonesController
} from './controllers';
import { currencyConversionProviders } from './providers/currency-conversion.provider';
import { ipCountryProviders } from './providers/ip-country.provider';
import { CurrencyConversionService } from './services/currency-conversion.service';
import { CurrencyConversionController } from './controllers/currency-conversion.controller';

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5
    }),
    MongoDBModule
  ],
  providers: [
    ...currencyConversionProviders,
    ...ipCountryProviders,
    CountryService,
    LanguageService,
    PhoneCodeService,
    TimeZonesService,
    CurrencyConversionService
  ],
  controllers: [
    CountryController,
    LanguageController,
    PhoneCodeController,
    TimezonesController,
    CurrencyConversionController
  ],
  exports: [
    CountryService
  ]
})
export class UtilsModule { }
