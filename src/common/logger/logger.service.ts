import {
  Injectable,
  Optional,
  Scope,
  LoggerService as NestLoggerService,
  LogLevel,
} from '@nestjs/common';
import pino from 'pino';
import { trace, context as otelContext } from '@opentelemetry/api';
import { ClsService } from 'nestjs-cls';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private pino: pino.Logger;
  private context?: string;

  constructor(@Optional() private readonly clsService?: ClsService) {
    const level = (process.env.LOG_LEVEL as pino.Level) ?? 'info';
    const isDev = process.env.NODE_ENV === 'dev' || !process.env.NODE_ENV;

    this.pino = pino({
      level,
      ...(isDev && {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true },
        },
      }),
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  private baseLogObject(): Record<string, unknown> {
    const obj: Record<string, unknown> = {};

    if (this.context) {
      obj.class = this.context;
    }

    const span = trace.getSpan(otelContext.active());
    if (span) {
      const spanContext = span.spanContext();
      obj.trace_id = spanContext.traceId;
      obj.span_id = spanContext.spanId;
    }

    const requestId = this.clsService?.get<string>('requestId');
    if (requestId) {
      obj.request_id = requestId;
    }

    return obj;
  }

  log(message: any, ...optionalParams: any[]) {
    this.write('info', message, optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    this.write('error', message, optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    this.write('warn', message, optionalParams);
  }

  debug(message: any, ...optionalParams: any[]) {
    this.write('debug', message, optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]) {
    this.write('trace', message, optionalParams);
  }

  fatal(message: any, ...optionalParams: any[]) {
    this.write('fatal', message, optionalParams);
  }

  setLogLevels(levels: LogLevel[]) {
    this.pino.level = levels.includes('fatal')
      ? 'fatal'
      : levels.includes('error')
        ? 'error'
        : levels.includes('warn')
          ? 'warn'
          : levels.includes('log')
            ? 'info'
            : levels.includes('debug')
              ? 'debug'
              : 'trace';
  }

  private write(level: pino.Level, message: any, optionalParams: unknown[]) {
    const base = this.baseLogObject();
    let contextStr: string | undefined;
    let traceStr: string | undefined;
    let data: Record<string, unknown> = {};

    for (const param of optionalParams) {
      if (typeof param === 'string') {
        if (param.includes('\n') || param.includes('    at ')) {
          traceStr = param;
        } else {
          contextStr = param;
        }
      } else if (typeof param === 'object' && param !== null) {
        data = { ...data, ...(param as Record<string, unknown>) };
      }
    }

    if (contextStr) {
      base.class = contextStr;
    }

    if (message instanceof Error) {
      data.err = {
        message: message.message,
        name: message.name,
        stack: traceStr ?? message.stack,
      };
      this.pino[level]({ ...base, ...data });
      return;
    }

    if (typeof message === 'object' && message !== null) {
      this.pino[level]({
        ...base,
        ...(message as Record<string, unknown>),
        ...data,
      });
      return;
    }

    if (traceStr) {
      data.trace = traceStr;
    }

    this.pino[level]({ ...base, ...data }, String(message));
  }
}

let fallbackLogger: LoggerService | undefined;

export function createLogger(context: string): LoggerService {
  if (!fallbackLogger) {
    fallbackLogger = new LoggerService();
  }
  const logger = Object.create(fallbackLogger) as LoggerService;
  logger.setContext(context);
  return logger;
}
