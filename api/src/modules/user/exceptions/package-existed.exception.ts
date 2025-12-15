import { HttpException } from '@nestjs/common';
import { PACKAGE_EXISTED } from '../../auth/constants';

export class PackageExistedException extends HttpException {
  constructor() {
    super(PACKAGE_EXISTED, 400);
  }
}
