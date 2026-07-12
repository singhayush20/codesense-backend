import { ConfigService } from '@nestjs/config';
import { Params } from 'nestjs-pino';
import { trace, context } from '@opentelemetry/api';
import pino from 'pino';

const isDev = () => process.env.ENVIRONMENT !== 'prod';

export const createStandaloneLogger = () =>
  pino({
    level: isDev() ? 'debug' : 'info',
    transport: isDev()
      ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
      : undefined,
    formatters: {
      log(object) {
        const span = trace.getSpan(context.active());
        if (!span) return { ...object };
        const { spanId, traceId } = span.spanContext();
        return { ...object, spanId, traceId };
      },
    },
  });

export const createLoggerConfig = (configService: ConfigService): Params => {
  const isProduction = configService.get<string>('app.env') === 'prod';

  return {
    pinoHttp: {
      level: isProduction ? 'info' : 'debug',
      transport: isProduction
        ? undefined
        : {
            target: 'pino-pretty',
            options: { colorize: true, singleLine: true },
          },
      formatters: {
        log(object) {
          const span = trace.getSpan(context.active());
          if (!span) return { ...object };
          const { spanId, traceId } = span.spanContext();
          return { ...object, spanId, traceId };
        },
      },
      serializers: {
        req: (req: { id: string; method: string; url: string }) => ({
          id: req.id,
          method: req.method,
          url: req.url,
        }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'body.password',
          'body.token',
        ],
        censor: '[REDACTED]',
      },
    },
  };
};
