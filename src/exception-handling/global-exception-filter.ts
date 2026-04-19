import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ExceptionCodes } from './exception-codes';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'UNKNOWN_ERROR';
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object') {
        const r = res as any;
        code = r.code || code;
        message = r.message || message;
      } else {
        message = res;
      }
    }

    console.error('Exception caught:', exception);

    response.status(status).json({
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

export function mapStatus(code: string): HttpStatus {
  switch (code) {
    case ExceptionCodes.USER_NOT_FOUND:
    case ExceptionCodes.ROLES_NOT_FOUND:
      return HttpStatus.NOT_FOUND;

    case ExceptionCodes.INVALID_JWT:
    case ExceptionCodes.INVALID_REFRESH_TOKEN:
    case ExceptionCodes.REFRESH_TOKEN_REUSED:
    case ExceptionCodes.USER_ACCOUNT_DISABLED:
      return HttpStatus.UNAUTHORIZED;

    default:
      return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}