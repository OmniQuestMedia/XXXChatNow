import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MoodBucket,
  MoodBucketSchema,
  TierBucketMapping,
  TierBucketMappingSchema,
  PublicMicroGratitude,
  PublicMicroGratitudeSchema,
  MoodMessageHistory,
  MoodMessageHistorySchema
} from './schemas';
import { MoodMessagingService } from './services';
import { MoodMessagingController } from './controllers';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MoodBucket.name,
        schema: MoodBucketSchema
      },
      {
        name: TierBucketMapping.name,
        schema: TierBucketMappingSchema
      },
      {
        name: PublicMicroGratitude.name,
        schema: PublicMicroGratitudeSchema
      },
      {
        name: MoodMessageHistory.name,
        schema: MoodMessageHistorySchema
      }
    ])
  ],
  providers: [MoodMessagingService],
  controllers: [MoodMessagingController],
  exports: [MoodMessagingService]
})
export class MoodMessagingModule {}
