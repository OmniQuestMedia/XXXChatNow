import { createContext } from 'react';
import { Socket } from 'socket.io-client';

export type ISocketContext = {
  getSocket: Function;
  socket: typeof Socket;
  socketStatus: string;
  connected: Function;
};

export const SocketContext = createContext<ISocketContext>({
  getSocket() {},
  socketStatus: '',
  socket: null,
  connected() {}
});
