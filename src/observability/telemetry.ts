import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import * as dotenv from 'dotenv';

dotenv.config({
  path: `.env.${process.env.ENVIRONMENT || 'dev'}`,
  quiet: true,
});

export const parseOtelHeaders = (value?: string): Record<string, string> => {
  if (!value) return {};

  return Object.fromEntries(
    value.split(',').flatMap((header) => {
      const separatorIndex = header.indexOf('=');
      if (separatorIndex === -1) return [];

      const key = header.slice(0, separatorIndex).trim();
      const headerValue = header.slice(separatorIndex + 1).trim();
      return key ? [[key, decodeURIComponent(headerValue)]] : [];
    }),
  );
};

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
  ? process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
  : process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    ? `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/$/, '')}/v1/traces`
    : undefined;

const traceExporter = otlpEndpoint
  ? new OTLPTraceExporter({
      url: otlpEndpoint,
      headers: parseOtelHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
    })
  : undefined;

const sdk = new NodeSDK({
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
    }),
  ],

  resource: resourceFromAttributes({
    'service.name': 'codesense-backend',
    'service.version': '1.0.0',
    'deployment.environment': process.env.ENVIRONMENT ?? 'dev',
  }),
});

sdk.start();
