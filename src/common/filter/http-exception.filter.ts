import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Response } from 'express';
import { BusinessException } from '../exception/business.exception';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const statusCode = exception.getStatus();

    let code = 'UNKNOWN_ERROR';
    let message = exception.message;

    if (exception instanceof BusinessException) {
      code = exception.errorCode;
    } else {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        if (typeof res.code === 'string') {
          code = res.code;
        }
        if (typeof res.message === 'string') {
          message = res.message;
        } else if (Array.isArray(res.message)) {
          message = res.message.join(', ');
        }
      }
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      code,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
