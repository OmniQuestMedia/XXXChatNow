import { HttpException } from '@nestjs/common';

export class StreamOfflineException extends HttpException {
  constructor(message?: string) {
    super(message || 'Model\'s stream is not ready!', 400);
  }
}
