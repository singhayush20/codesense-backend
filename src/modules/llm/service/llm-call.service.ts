import { Injectable } from '@nestjs/common';
import { LlmProviderRegistry } from '../../ai/registry/llm-provider.registry';
import { ProviderType } from '../../ai/enums/provider.type';
import { LlmExecutionContext } from '../../ai/dto/execution-context.dto';
import { LlmRequest } from '../../ai/dto/llm-request.dto';
import { LlmResponse } from '../../ai/dto/llm-response.dto';
import { LlmObservabilityService } from '../../ai/service/llm-observability.service';
import { LlmRetryService } from '../../ai/service/llm-retry.service';
import { LlmRequestValidatorService } from '../../ai/service/request-validator.service';
import { RequestContextService } from '../../request-context/service/request-context/request-context.service';

@Injectable()
export class LlmService {
  constructor(
    private readonly registry: LlmProviderRegistry,
    private readonly retryService: LlmRetryService,
    private readonly observability: LlmObservabilityService,
    private readonly requestValidatorService: LlmRequestValidatorService,
    private readonly contextService: RequestContextService,
  ) {}

  async generate(
    provider: ProviderType,
    request: LlmRequest,
    context: LlmExecutionContext,
  ): Promise<LlmResponse> {
    const validatedRequest = this.requestValidatorService.validate(request);
    const adapter = this.registry.get(provider);
    const span = this.observability.startSpan('llm.generate');
    const startTime = performance.now();

    try {
      span.setAttributes({
        'llm.provider': provider,
        'llm.model': validatedRequest.model,
        'llm.temperature': validatedRequest.temperature ?? 0,
        'llm.max_tokens': validatedRequest.maxTokens ?? 0,
        'llm.request_id':
          context.requestId ??
          this.contextService.getRequestId() ??
          'undefined',
      });

      const response = await this.retryService.execute(() =>
        adapter.generate(validatedRequest, context),
      );

      const latencyMs = performance.now() - startTime;

      this.observability.trackSuccess({
        provider,
        model: validatedRequest.model,
        latencyMs,
        requestId: context.requestId,
      });

      if (response.usage) {
        this.observability.trackTokenUsage({
          provider,
          model: validatedRequest.model,
          inputTokens: response.usage.promptTokens ?? 0,
          outputTokens: response.usage.completionTokens ?? 0,
        });
      }

      span.setAttributes({
        'llm.finish_reason': response.finishReason ?? 'unknown',
        'llm.input_tokens': response.usage?.promptTokens ?? 0,
        'llm.output_tokens': response.usage?.completionTokens ?? 0,
        'llm.response_text': response.text,
      });

      this.observability.recordSpanSuccess(span);

      return response;
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error('Unknown LLM error');

      this.observability.trackFailure({
        provider,
        model: validatedRequest.model,
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
