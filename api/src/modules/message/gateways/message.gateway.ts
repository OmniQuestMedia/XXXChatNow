import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { HttpException, Logger, UseGuards } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { WSGuard } from 'src/modules/auth/guards';
import { AuthService } from 'src/modules/auth/services';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { UserService } from 'src/modules/user/services';
import { PerformerService } from 'src/modules/performer/services';
import { WheelResultService } from 'src/modules/wheel/services';
import { PerformerOfflineException } from 'src/modules/performer/exceptions';
import { ConversationService } from '../services';

// sample to see how to conenct with namesapce
@WebSocketGateway()
export class MessageGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly authService: AuthService,
    private readonly conversationService: ConversationService,
    private readonly socketService: SocketUserService,
    private readonly wheelResultService: WheelResultService,
    private readonly userService: UserService,
    private readonly performerService: PerformerService
  ) { }

  @WebSocketServer() server: Server;

  private logger: Logger = new Logger('MessageGateway');

  @SubscribeMessage('msgToServer')
  @UseGuards(WSGuard)
  handleMessage(client: Socket, payload: string): void {
    this.server.emit('msgToClient', payload);
  }

  afterInit() {
    this.logger.log('Init');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('spin-wheel/create')
  async spinWheel(client: Socket, payload: {
    conversationId: string,
    streamId: string,
    streamSessionId: string,
    performerId: string
  }): Promise<any> {
    try {


      const {
        conversationId, performerId
      } = payload;
      if (!conversationId || !performerId) {
        return {};
      }

      const [conversation, performer] = await Promise.all([
        this.conversationService.findById(
          conversationId
        ),
        this.performerService.findById(
          performerId
        )
      ]);

      if (!performer.isOnline) {
        throw new PerformerOfflineException();
      }

      if (!conversation || !performer) return { error: 'no data' };

      const { token } = client.handshake.query;
      if (!token) return { error: 'no token' };

      const user = await this.authService.getSourceFromJWT(token);
      if (!user) return { error: 'no user' };
      if (user.balance < performer.spinWheelPrice) {
        throw new HttpException('Not enough balance!', 400);
      }

      const action = await this.wheelResultService.getResult(performerId);
      await this.wheelResultService.create({
        streamId: conversation.streamId,
        streamSessionId: conversation.streamId,
        performerId,
        conversationId,
        action,
        description: `${user.username} received ${action} by spinned the wheel`,
        creatorId: user._id,
        price: performer.spinWheelPrice
      });

      return {
        segment: action
      };
    } catch (err) {
      const error = await err;
      return {
        error
      };
    }
  }
}
