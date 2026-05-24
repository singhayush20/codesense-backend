import { Injectable, Logger } from '@nestjs/common';

import { metrics, Counter, Histogram, Meter, Span } from '@opentelemetry/api';
import { SpanStatusCode, trace } from '@opentelemetry/api';

@Injectable()
export class LlmObservabilityService {
  private readonly logger = new Logger(LlmObservabilityService.name);
  private readonly tracer = trace.getTracer('llm-observability');
  private readonly meter: Meter;
  private readonly requestCounter: Counter;
  private readonly failureCounter: Counter;
  private readonly inputTokenCounter: Counter;
  private readonly outputTokenCounter: Counter;
  private readonly latencyHistogram: Histogram;

  constructor() {
    this.meter = metrics.getMeter('llm-metrics');
    this.requestCounter = this.meter.createCounter('llm_requests_total');
    this.failureCounter = this.meter.createCounter('llm_failures_total');
    this.inputTokenCounter = this.meter.createCounter('llm_input_tokens_total');
    this.outputTokenCounter = this.meter.createCounter(
      'llm_output_tokens_total',
    );
    this.latencyHistogram = this.meter.createHistogram(
      'llm_request_duration_ms',
    );
  }

  startSpan(operationName: string) {
    return this.tracer.startSpan(operationName);
  }

  trackSuccess(params: {
    provider: string;
    model: string;
    latencyMs: number;
    requestId?: string;
  }): void {
    const labels = {
      provider: params.provider,
      model: params.model,
    };

    this.requestCounter.add(1, labels);

    this.latencyHistogram.record(params.latencyMs, labels);

    this.logger.log({
      event: 'llm_request_success',
      provider: params.provider,
      model: params.model,
      latencyMs: params.latencyMs,
      requestId: params.requestId,
    });
  }

  trackFailure(params: {
    provider: string;
    model?: string;
    error: Error;
    requestId?: string;
  }): void {
    const labels = {
      provider: params.provider,
      model: params.model ?? 'unknown',
      error_type: params.error.constructor.name,
    };

    this.failureCounter.add(1, labels);

    this.logger.error({
      event: 'llm_request_failure',
      provider: params.provider,
      model: params.model,
      requestId: params.requestId,
      error: params.error.message,
      stack: params.error.stack,
    });
  }

  trackTokenUsage(params: {
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
  }): void {
    const labels = {
      provider: params.provider,

      model: params.model,
    };

    this.inputTokenCounter.add(params.inputTokens, labels);
    this.outputTokenCounter.add(params.outputTokens, labels);

    this.logger.log({
      event: 'llm_token_usage',
      provider: params.provider,
      model: params.model,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
    });
  }

  recordSpanSuccess(span: Span): void {
    span.setStatus({
      code: SpanStatusCode.OK,
    });
  }

  recordSpanFailure(span: Span, error: Error): void {
    span.recordException(error);

    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
  }
}
