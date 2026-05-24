import { NodeSDK } from '@opentelemetry/sdk-node';

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

import { resourceFromAttributes } from '@opentelemetry/resources';

const traceExporter = new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces',
});

const sdk = new NodeSDK({
  traceExporter,

  resource: resourceFromAttributes({
    'service.name': 'codesense-backend',
    'service.version': '1.0.0',
    'deployment.environment': process.env.NODE_ENV ?? 'development',
  }),
});

sdk.start();
