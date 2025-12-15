import { authService } from '@services/auth.service';
import getConfig from 'next/config';
import {
  ReactNode, useEffect, useMemo, useRef, useState
} from 'react';
import { connect, ConnectedProps } from 'react-redux';
import SocketIO from 'socket.io-client';

import { SocketContext } from './SocketContext';

type ISocketProps = {
  children: ReactNode;
}

const mapStates = (state: any) => ({
  loggedIn: state.auth.loggedIn
});

const connector = connect(mapStates);

type PropsFromRedux = ConnectedProps<typeof connector>;

function Socket({
  children,
  loggedIn
}: ISocketProps & PropsFromRedux) {
  const { publicRuntimeConfig: config } = getConfig();
  // support 1 connection right now only
  const socket = useRef<any>(null);

  const [socketState, setSocketState] = useState(null);
  const [socketStatus, setSocketStatus] = useState('initialized');

  const login = () => {
    if (!socket) return false;

    const token = authService.getToken();
    return socket.current.emit('auth/login', { token });
  };

  const connectSocket = () => {
    const token = loggedIn && authService.getToken();
    const defaultOptions = {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1 * 1000,
      reconnectionDelayMax: 10 * 1000,
      autoConnect: true,
      transports: ['websocket', 'polling', 'long-polling'],
      rejectUnauthorized: true
    };
    const options = {
      ...defaultOptions,
      opts: {
        query: token ? `token=${token}` : ''
      },
      ...(token && { query: { token } })
    };
    const socketUrl = config.SOCKET_ENDPOINT as string;
    socket.current = SocketIO(socketUrl, options) as any;
    setSocketState(socket.current);

    socket.current.status = 'initialized';
    setSocketStatus('initialized');

    socket.current.on('connect', () => {
      socket.current.status = 'connected';
      setSocketStatus('connected');
    });

    socket.current.on('disconnect', () => {
      socket.current.status = 'disconnected';
      setSocketStatus('disconnect');
    });

    socket.current.on('error', () => {
      socket.current.status = 'failed';
      setSocketStatus('failed');
    });

    socket.current.on('reconnect', () => {
      socket.current.status = 'connected';
      login();
      setSocketStatus('connected');
    });

    socket.current.on('reconnecting', () => {
      socket.current.status = 'reconnecting';
      setSocketStatus('reconnecting');
    });

    socket.current.on('reconnect_failed', () => {
      socket.current.status = 'failed';
      setSocketStatus('failed');
    });
  };

  const getSocket = () => socket.current;

  const connected = () => socketStatus === 'connected';

  const socketValue = useMemo(() => ({
    socket: socketState,
    getSocket,
    socketStatus,
    connected
  }), [socketState, socketStatus]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // connect
    if (socket.current?.active) socket.current.close();
    connectSocket();

    // eslint-disable-next-line consistent-return
    return () => {
      if (socket.current?.active) socket.current.close();
    };
  }, [loggedIn]);

  return (
    <SocketContext.Provider value={socketValue}>
      {children}
    </SocketContext.Provider>
  );
}

export default connector(Socket);
