import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(GlobalExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

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

    const req = request as Request & {
      id?: string;
      user?: { userId?: string };
    };

    this.logger.error(
      {
        err: exception,
        req: {
          id: req.id,
          method: req.method,
          url: req.url,
        },
        userId: req.user?.userId ?? null,
      },
      'Unhandled exception',
    );

    response.status(status).json({
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
