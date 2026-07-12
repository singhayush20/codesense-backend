import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { createStandaloneLogger } from '../config/logger.config';

const logger = createStandaloneLogger();

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

      if (typeof res === 'object' && res !== null) {
        const r = res as {
          code?: string;
          message?: string;
        };

        code = r.code ?? code;
        message = r.message ?? message;
      } else {
        message = res;
      }
    }

    logger.error({ err: exception, path: request.url }, 'Unhandled exception');

    response.status(status).json({
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
