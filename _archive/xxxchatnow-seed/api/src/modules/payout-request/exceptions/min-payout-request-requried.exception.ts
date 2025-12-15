import { HttpException, HttpStatus } from '@nestjs/common';

export const MIN_PAYOUT_REQUEST_REQUIRED = 'MIN_PAYOUT_REQUEST_REQUIRED';

export class MinPayoutRequestRequiredException extends HttpException {
  constructor(response?: string) {
    super(
      response || 'Min payout request not reached!',
      HttpStatus.BAD_REQUEST
    );
  }
}
