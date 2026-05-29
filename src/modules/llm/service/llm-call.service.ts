import { Injectable } from '@nestjs/common';
import { LlmProviderRegistry } from '../../ai/registry/llm-provider.registry';
import { ProviderType } from '../../ai/enums/provider.type';
import { LlmExecutionContext } from '../../ai/dto/execution-context.dto';
import { LlmRequest } from '../../ai/dto/llm-request.dto';
import { LlmResponse } from '../../ai/dto/llm-response.dto';
import { LlmObservabilityService } from '../../ai/service/llm-observability.service';
import { LlmRetryService } from '../../ai/service/llm-retry.service';
import { RequestContextService } from '../../request-context/service/request-context/request-context.service';
import { z } from 'zod';

@Injectable()
export class LlmService {
  constructor(
    private readonly registry: LlmProviderRegistry,
    private readonly retryService: LlmRetryService,
    private readonly observability: LlmObservabilityService,
    private readonly contextService: RequestContextService,
  ) {}

  async generate<TSchema extends z.ZodTypeAny>(
    provider: ProviderType,
    request: LlmRequest<TSchema>,
    context: LlmExecutionContext,
  ): Promise<
    LlmResponse<TSchema extends z.ZodTypeAny ? z.infer<TSchema> : string>
  > {
    const adapter = this.registry.get(provider);
    const span = this.observability.startSpan('llm.generate');
    const startTime = performance.now();

    try {
      span.setAttributes({
        'llm.provider': provider,
        'llm.model': request.model,
        'llm.temperature': request.temperature ?? 0,
        'llm.max_tokens': request.maxTokens ?? 0,
        'llm.request_id':
          context.requestId ??
          this.contextService.getRequestId() ??
          'undefined',
      });

      const response = await this.retryService.execute(() =>
        adapter.generate(request, context),
      );

      const latencyMs = performance.now() - startTime;

      this.observability.trackSuccess({
        provider,
        model: request.model,
        latencyMs,
        requestId: context.requestId,
      });

      if (response.usage) {
        this.observability.trackTokenUsage({
          provider,
          model: request.model,
          inputTokens: response.usage.promptTokens ?? 0,
          outputTokens: response.usage.completionTokens ?? 0,
        });
      }

      span.setAttributes({
        'llm.finish_reason': response.finishReason ?? 'unknown',
        'llm.input_tokens': response.usage?.promptTokens ?? 0,
        'llm.output_tokens': response.usage?.completionTokens ?? 0,
        'llm.response_text': JSON.stringify(response.response),
      });

      this.observability.recordSpanSuccess(span);

      return response;
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error('Unknown LLM error');

      this.observability.trackFailure({
        provider,
        model: request.model,
        error: normalizedError,
        requestId: context.requestId,
      });

      span.recordException(normalizedError);

      span.setAttributes({
        'llm.error': normalizedError.message,
        'llm.error_type': normalizedError.constructor.name,
        request_id: context.requestId ?? 'undefined',
      });

      this.observability.recordSpanFailure(span, normalizedError);
      throw normalizedError;
    } finally {
      span.end();
    }
  }
}
