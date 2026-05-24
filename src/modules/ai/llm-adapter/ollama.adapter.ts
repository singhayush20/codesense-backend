import { Injectable, Logger } from '@nestjs/common';

import { generateText } from 'ai';
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

@Injectable()
export class OllamaAdapter implements LlmProviderAdapter {
  private readonly logger = new Logger(OllamaAdapter.name);

  readonly provider = ProviderType.OLLAMA;

  async generate(
    request: LlmRequest,
    context: LlmExecutionContext,
  ): Promise<LlmResponse> {
    try {
      const credentials = this.validateCredentials(context.credentials);

      const ollama = createOllama({
        baseURL: credentials.baseUrl,
      });

      const result = await withTimeout(async (signal) => {
        return generateText({
          model: ollama(request.model),
          messages: AiSdkMessageMapper.toModelMessages(request.messages),
          temperature: request.temperature,
          maxOutputTokens: request.maxTokens,
          topP: request.topP,
          abortSignal: signal,
        });
      }, context.timeoutMs ?? 30_000);

      return {
        provider: this.provider,

        model: request.model,

        text: result.text,

        finishReason: result.finishReason,

        usage: {
          promptTokens: result.usage?.inputTokens,

          completionTokens: result.usage?.outputTokens,

          totalTokens: result.usage?.totalTokens,
        },

        raw: {
          finishReason: result.finishReason,

          warnings: result.warnings,
        },
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
