import { Injectable } from '@nestjs/common';
import { generateText, Output, ToolSet } from 'ai';
import { createOllama } from 'ai-sdk-ollama';
import { LlmExecutionContext } from '../dto/execution-context.dto';
import { LlmRequest } from '../dto/llm-request.dto';
import { LlmResponse } from '../dto/llm-response.dto';
import { OllamaCredentials } from '../dto/provider-credentials.dto';
import { LlmProviderAdapter } from './llm.adapter';
import { ProviderType } from '../enums/provider.type';
import { AiSdkMessageMapper } from '../mapper/ai-message.mapper';
import { withTimeout } from '../util/llm-request-timeout.util';
import { OllamaErrorMapper } from '../errors/ollama-error.mapper';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { z } from 'zod';
import { SpanStatusCode, trace } from '@opentelemetry/api';

@Injectable()
export class OllamaAdapter implements LlmProviderAdapter {
  @InjectPinoLogger(OllamaAdapter.name)
  private readonly logger: PinoLogger;

  readonly provider = ProviderType.OLLAMA;

  async generate<TSchema extends z.ZodTypeAny | undefined = undefined>(
    request: LlmRequest<TSchema>,
    context: LlmExecutionContext,
    toolSet: ToolSet,
  ): Promise<
    LlmResponse<TSchema extends z.ZodTypeAny ? z.infer<TSchema> : string>
  > {
    try {
      const activeSpan = trace.getActiveSpan();

      const credentials = this.validateCredentials(context.credentials);

      const providerSettings: Parameters<typeof createOllama>[0] = {
        // baseURL: credentials.baseUrl,
        baseURL: `https://ollama.com`,
        ...(credentials.apiKey ? { apiKey: credentials.apiKey } : {}),
      };

      const ollama = createOllama(providerSettings);

      const result = await withTimeout(
        async (signal) => {
          return generateText({
            model: ollama(request.model),
            system: request.systemPrompt,
            messages: AiSdkMessageMapper.toModelMessages(request.messages),
            temperature: request.temperature,
            maxOutputTokens: request.maxTokens,
            topP: request.topP,
            abortSignal: signal,
            output: request.responseSchema
              ? Output.object({
                  schema: request.responseSchema,
                })
              : undefined,
            tools: toolSet,
            experimental_onToolCallStart(event) {
              const toolName = event.toolCall.toolName;
              const toolCallId = event.toolCall.toolCallId;
              const input = event.toolCall.input as unknown;

              activeSpan?.addEvent('tool.call.start', {
                'tool.name': toolName,
                'tool.call.id': toolCallId,
                'tool.input': JSON.stringify(input),
              });
            },
            experimental_onToolCallFinish(event) {
              const { toolName, toolCallId } = event.toolCall;
              const { output, error, durationMs } = event;

              if (event.error) {
                activeSpan?.addEvent('tool.call.error', {
                  'tool.name': toolName,
                  'tool.call.id': toolCallId,
                  'tool.duration.ms': event.durationMs,
                  'tool.error': JSON.stringify(error),
                });

                activeSpan?.setStatus({
                  code: SpanStatusCode.ERROR,
                  message: JSON.stringify(error),
                });
              } else {
                activeSpan?.addEvent('tool.call.finish', {
                  'tool.name': toolName,
                  'tool.call.id': toolCallId,
                  'tool.duration.ms': durationMs,
                  'tool.output': JSON.stringify(output),
                });
              }
            },
          });
        },
        context.timeoutMs ?? 30_000,
        context.abortSignal,
      );

      return {
        provider: this.provider,
        model: request.model,
        response: result.output as TSchema extends z.ZodTypeAny
          ? z.infer<TSchema>
          : string,
        finishReason: result.finishReason,
        usage: {
          promptTokens: result.usage?.inputTokens,
          completionTokens: result.usage?.outputTokens,
          totalTokens: result.usage?.totalTokens,
        },
        raw: result,
      };
    } catch (error) {
      const normalizedError = OllamaErrorMapper.map(error);

      this.logger.error({
        message: normalizedError.message,
        provider: this.provider,
        requestId: context.requestId,
        error: normalizedError,
      });

      throw normalizedError;
    }
  }

  private validateCredentials(
    credentials: LlmExecutionContext['credentials'],
  ): OllamaCredentials {
    if (credentials.provider !== ProviderType.OLLAMA) {
      throw new Error('Invalid Ollama credentials');
    }

    return credentials;
  }
}
