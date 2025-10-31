import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import { IPCountrySchema } from '../schemas/ip-country.schema';

export const IP_COUNTRY_DB_PROVIDER = 'IP_COUNTRY_DB_PROVIDER';

export const ipCountryProviders = [
  {
    provide: IP_COUNTRY_DB_PROVIDER,
    useFactory: (connection: Connection) => connection.model('IPCountry', IPCountrySchema),
    inject: [MONGO_DB_PROVIDER]
  }
];
