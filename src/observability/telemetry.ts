import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import {
  LoggerProvider,
  BatchLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { logs } from '@opentelemetry/api-logs';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
} from '@opentelemetry/semantic-conventions';

const otelEnabled = process.env.OTEL_ENABLED !== 'false';

if (otelEnabled) {
  const otelEndpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'https://otlp.grafana.net:4318';

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'codesense-backend',
    [ATTR_SERVICE_VERSION]: '1.0.0',
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env.NODE_ENV ?? 'development',
  });

  const headers: Record<string, string> = {};
  const raw = process.env.OTEL_EXPORTER_OTLP_HEADERS;
  if (raw) {
    for (const entry of raw.split(',')) {
      const sep = entry.indexOf('=');
      if (sep > 0) {
        const key = entry.slice(0, sep).trim();
        let val = entry.slice(sep + 1).trim();
        try {
          // Support values that were URL-encoded (e.g. Authorization=Basic%20xxx)
          val = decodeURIComponent(val);
        } catch {
          // leave as-is if decoding fails
        }
        headers[key] = val;
      }
    }
  }

  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({
      url: `${otelEndpoint}/v1/traces`,
      headers,
    }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: `${otelEndpoint}/v1/metrics`,
        headers,
      }),
      exportIntervalMillis: 60_000,
    }),
    instrumentations: getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-ioredis': { enabled: true },
      '@opentelemetry/instrumentation-pg': { enabled: true },
      '@opentelemetry/instrumentation-pino': { enabled: true },
    }),
    resource,
  });

  sdk.start();

  // Emit a masked startup log to help debug OTLP connectivity in dev
  try {
    const maskedHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers)) {
      if (!v) {
        maskedHeaders[k] = '';
      } else if (v.length <= 8) {
        maskedHeaders[k] = '****';
      } else {
        maskedHeaders[k] = `${v.slice(0, 8)}...`;
      }
    }

    // Use console.* so it appears even if pino/OTel not fully wired yet
    // Avoid printing secrets in full

    console.info('[telemetry] initialized', {
      otelEnabled: true,
      endpoint: otelEndpoint,
      headers: maskedHeaders,
    });
  } catch (err) {
    console.warn('[telemetry] debug log failed', err);
  }

  const loggerProvider = new LoggerProvider({
    resource,
    processors: [
      new BatchLogRecordProcessor(
        new OTLPLogExporter({
          url: `${otelEndpoint}/v1/logs`,
          headers,
        }),
        { scheduledDelayMillis: 1000 },
      ),
    ],
  });
  logs.setGlobalLoggerProvider(loggerProvider);

  // Enable OTel diagnostics in non-production to see exporter activity
  if (process.env.NODE_ENV !== 'production') {
    try {
      diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
    } catch {
      // ignore if diag logger isn't available
    }
  }

  // Optional: emit a single test log record when explicitly requested
  if (process.env.OTEL_SEND_TEST_LOG === 'true') {
    try {
      const otelLogger = logs.getLogger('codesense-backend-test');
      otelLogger.emit({
        body: 'OTEL test log from application',
        severityText: 'INFO',
        attributes: {
          'service.name': 'codesense-backend',
        },
      });

      console.info('[telemetry] emitted test log');
    } catch (err) {
      console.warn('[telemetry] failed to emit test log', err);
    }
  }

  const shutdown = () => {
    loggerProvider.shutdown().catch(() => {});
    sdk.shutdown().catch(() => {});
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export {};
