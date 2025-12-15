import { Global, Module } from '@nestjs/common';
import { mongoDBProviders } from './mongodb.provider';

@Global()
@Module({
  providers: [...mongoDBProviders],
  exports: [...mongoDBProviders]
})
export class MongoDBModule { }
