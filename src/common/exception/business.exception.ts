import { HttpException } from '@nestjs/common';
import type { ErrorCode } from '../const/error-codes';

export class BusinessException extends HttpException {
  readonly errorCode: string;

  constructor(errorCode: ErrorCode) {
    super(
      { code: errorCode.code, message: errorCode.message },
      errorCode.statusCode,
    );
    this.errorCode = errorCode.code;
  }
}
