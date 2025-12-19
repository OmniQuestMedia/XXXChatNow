import { IoAdapter } from '@nestjs/platform-socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { ConfigService } from 'nestjs-config';

export class RedisIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: any): any {
    // TODO - load from config
    const pubClient = createClient(ConfigService.get('redis'));
    const subClient = pubClient.duplicate();

    const redisAdapter = createAdapter(pubClient, subClient);

    const server = super.createIOServer(port, options);
    server.adapter(redisAdapter);
    return server;
  }
}
