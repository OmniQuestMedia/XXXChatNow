import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { PerformerModule } from '../performer/performer.module';
import { SocketModule } from '../socket/socket.module';
import { MessageListener, StreamMessageListener } from './listeners';
import {
  ConversationService,
  MessageService,
  NotificationMessageService
} from './services';
import { ConversationController } from './controllers/conversation.controller';
import { MessageController } from './controllers/message.controller';
import { FavouriteModule } from '../favourite/favourite.module';
import { StreamModule } from '../stream/stream.module';
import {
  Conversation,
  ConversationSchema,
  Message,
  MessageSchema,
  NotificationMessage,
  NotificationMessageSchema
} from './schemas';
import { CommunityChatController } from './controllers/community-chat.controller';
import { CommunityChatService } from './services/community-chat.service';
import { WheelModule } from '../wheel/wheel.module';
import { MessageGateway } from './gateways/message.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Conversation.name,
        schema: ConversationSchema
      },
      {
        name: Message.name,
        schema: MessageSchema
      },
      {
        name: NotificationMessage.name,
        schema: NotificationMessageSchema
      }
    ]),
    // inject user module because we request guard from auth, need to check and fix dependencies if not needed later
    forwardRef(() => UserModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => AuthModule),
    forwardRef(() => SocketModule),
    forwardRef(() => FavouriteModule),
    forwardRef(() => StreamModule),
    forwardRef(() => WheelModule)
  ],
  providers: [
    ConversationService,
    MessageService,
    NotificationMessageService,
    MessageListener,
    StreamMessageListener,
    CommunityChatService,
    MessageGateway
  ],
  controllers: [
    ConversationController,
    MessageController,
    CommunityChatController
  ],
  exports: [ConversationService, MessageService, CommunityChatService]
})
export class MessageModule { }
