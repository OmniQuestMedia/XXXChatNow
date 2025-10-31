import { HttpException } from '@nestjs/common';


export class NotEnoughTierLimitExeption extends HttpException {
  constructor() {
    super('Oops, you not enough tier limit', 400);
  }
}