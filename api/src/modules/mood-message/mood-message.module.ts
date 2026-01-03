/**
 * Mood Message Module
 * 
 * Provides mood-based message delivery with tracking and audit trail.
 * Implements MODEL_MOOD_RESPONSE_SYSTEM.md specifications.
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MoodMessage, MoodMessageSchema } from './schemas/mood-message.schema';
import { MessageTemplate, MessageTemplateSchema } from './schemas/message-template.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { MoodMessageService } from './services';
import { MoodMessageController } from './controllers';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MoodMessage.name, schema: MoodMessageSchema },
      { name: MessageTemplate.name, schema: MessageTemplateSchema },
      { name: User.name, schema: UserSchema }
    ])
  ],
  controllers: [MoodMessageController],
  providers: [MoodMessageService],
  exports: [MoodMessageService]
})
export class MoodMessageModule {}
