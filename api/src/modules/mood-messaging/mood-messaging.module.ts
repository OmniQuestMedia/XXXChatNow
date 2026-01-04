import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelMoodState, ModelMoodStateSchema } from './schemas/mood-state.schema';
import { MoodMessagingService } from './services/mood-messaging.service';
import { LoggerModule } from '../logger/logger.module';

/**
 * Mood Messaging Module
 * 
 * Phase 6: Implements mood-based messaging for TIP_GRID_ITEM settlements.
 * Manages tier-based mood bucket system with non-repetitive message selection.
 * Implements the mood analysis and response generation logic.
 * Part of the Model Mood Response System (MMRS).
 * 
 * References:
 * - MOOD_MESSAGING_BRIEFING.md
 * - MODEL_MOOD_RESPONSE_SYSTEM.md
 * 
 * @module MoodMessagingModule
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ModelMoodState.name, schema: ModelMoodStateSchema }
    ]),
    LoggerModule
  ],
  controllers: [],
  providers: [MoodMessagingService],
  exports: [MoodMessagingService]
})
export class MoodMessagingModule {}
