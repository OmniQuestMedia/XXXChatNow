import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import { CurrencyConversionSchema } from '../schemas/currency-conversion.schema';

export const CURRENCY_CONVERSION_DB_PROVIDER = 'CURRENCY_CONVERSION_DB_PROVIDER';

export const currencyConversionProviders = [
  {
    provide: CURRENCY_CONVERSION_DB_PROVIDER,
    useFactory: (connection: Connection) => connection.model('CurrencyConversion', CurrencyConversionSchema),
    inject: [MONGO_DB_PROVIDER]
  }
];
