import { useRouter } from 'next/router';
import { useContext, useEffect } from 'react';

import { SocketContext } from './SocketContext';

type IEventProps = {
  event: string;
  handler: Function;
  handleRouterChange?: boolean;
}

export function Event({
  event,
  handler,
  handleRouterChange = false
}: IEventProps) {
  const { getSocket, socket, socketStatus } = useContext(SocketContext);
  const router = useRouter();

  const _handleRouteChangeComplete = () => {
    const gsocket = getSocket();
    handleRouterChange && gsocket?.on(event, handler);
  };

  const handleOffSocket = () => {
    const gsocket = getSocket();
    gsocket?.off(event, handler);
    router.events.off('routeChangeComplete', _handleRouteChangeComplete);
  };

  useEffect(() => {
    if (socketStatus !== 'connected') return handleOffSocket();

    router.events.on('routeChangeComplete', _handleRouteChangeComplete);
    socket?.on(event, handler);

    return handleOffSocket;
  }, [socketStatus]);

  return null;
}

export default Event;
