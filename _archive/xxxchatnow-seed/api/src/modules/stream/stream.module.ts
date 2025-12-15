import {
  MiddlewareConsumer, Module, NestModule, RequestMethod, forwardRef
} from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import * as https from 'https';
import { RequestLoggerMiddleware } from 'src/modules/logger/request-log.middleware';
import { MongooseModule } from '@nestjs/mongoose';
import { PerformerModule } from '../performer/performer.module';
import { AuthModule } from '../auth/auth.module';
import {
  StreamService, RequestService, AntMediaService, StreamPeekInService
} from './services';
import { StreamController, StreamPeekInController, StreamWekhookController } from './controllers';
import { UserModule } from '../user/user.module';
import { MessageModule } from '../message/message.module';
import { SocketModule } from '../socket/socket.module';
import { StreamConversationWsGateway, PrivateStreamWsGateway, PublicStreamWsGateway } from './gateways';
import { StreamConnectListener, StreamGoalListener } from './listeners';
import { SettingModule } from '../settings/setting.module';
import {
  Stream, StreamSchema, StreamGoal, StreamGoalSchema,
  StreamPeekInSchema
} from './schemas';
import { StreamGoalsService } from './services/stream-goals.service';
import { StreamGoalsController } from './controllers/stream-goals.controller';
import { StreamPeekIn } from './dtos';
import { PurchasedItemModule } from '../purchased-item/purchased-item.module';

const agent = new https.Agent({
  rejectUnauthorized: false
});

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Stream.name,
        schema: StreamSchema
      },
      {
        name: StreamGoal.name,
        schema: StreamGoalSchema
      },
      {
        name: StreamPeekIn.name,
        schema: StreamPeekInSchema
      }
    ]),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
      httpsAgent: agent
    }),
    forwardRef(() => UserModule),
    forwardRef(() => SettingModule),
    forwardRef(() => SocketModule),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => MessageModule),
    // forwardRef(() => SocialConnectModule),
    forwardRef(() => PurchasedItemModule)
  ],
  providers: [
    StreamService,
    RequestService,
    StreamConnectListener,
    StreamConversationWsGateway,
    PrivateStreamWsGateway,
    PublicStreamWsGateway,
    AntMediaService,
    StreamGoalsService,
    StreamGoalListener,
    // TweetPublicStreamListener,
    StreamPeekInService
  ],
  controllers: [StreamController, StreamWekhookController, StreamGoalsController, StreamPeekInController],
  exports: [StreamService, StreamPeekInService]
})
export class StreamModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware)
      .forRoutes({ path: '/streaming/*/callback', method: RequestMethod.ALL });
  }
}
