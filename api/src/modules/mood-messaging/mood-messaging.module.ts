import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from 'nestjs-config';
import {
  MoodBucket,
  MoodBucketSchema,
  ModelMoodConfig,
  ModelMoodConfigSchema,
  UserMessageHistory,
  UserMessageHistorySchema
} from './schemas';
import { MoodMessagingService } from './services';
import { MoodMessagingController } from './controllers';

/**
 * Mood Messaging Module
 * Handles mood-based automated responses for models
 */
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      {
        name: MoodBucket.name,
        schema: MoodBucketSchema
      },
      {
        name: ModelMoodConfig.name,
        schema: ModelMoodConfigSchema
      },
      {
        name: UserMessageHistory.name,
        schema: UserMessageHistorySchema
      }
    ])
  ],
  providers: [MoodMessagingService],
  controllers: [MoodMessagingController],
  exports: [MoodMessagingService]
})
export class MoodMessagingModule {}
