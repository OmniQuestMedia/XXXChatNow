import { HttpException } from '@nestjs/common';
import { ACCOUNT_ENABLE_2FA } from '../constants';

export class AccountEnable2FAException extends HttpException {
  constructor() {
    super(ACCOUNT_ENABLE_2FA, 400);
  }
}
