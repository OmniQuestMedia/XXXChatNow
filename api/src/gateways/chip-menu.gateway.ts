import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class ChipMenuGateway {
  @WebSocketServer() server: Server;

  // Utility: send menu update to all users for a room/model
  emitMenuUpdate(room: string, data: any) {
    this.server.to(room).emit('menuUpdate', data);
  }

  // Utility: send promotion activation, purchase events, etc.
  emitPromotionEvent(room: string, data: any) {
    this.server.to(room).emit('promotionEvent', data);
  }

  // ...Other custom events like gratitude, goal, etc.

  // Listen for user actions if needed
  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() data: { room: string }, @ConnectedSocket() client: Socket) {
    client.join(data.room);
  }
}
