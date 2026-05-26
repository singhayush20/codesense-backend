import { Injectable, Logger } from '@nestjs/common';

import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

import { LlmExecutionContext } from '../dto/execution-context.dto';
import { LlmRequest } from '../dto/llm-request.dto';
import { LlmResponse } from '../dto/llm-response.dto';
import { GeminiCredentials } from '../dto/provider-credentials.dto';

import { LlmProviderAdapter } from './llm.adapter';

import { ProviderType } from '../enums/provider.type';

import { AiSdkMessageMapper } from '../mapper/ai-message.mapper';

import { withTimeout } from '../util/llm-request-timeout.util';
import { GeminiErrorMapper } from '../errors/gemini-error.mapper';

@Injectable()
export class GeminiAdapter implements LlmProviderAdapter {
  private readonly logger = new Logger(GeminiAdapter.name);

  readonly provider = ProviderType.GEMINI;

  async generate(
    request: LlmRequest,
    context: LlmExecutionContext,
  ): Promise<LlmResponse> {
    try {
      const credentials = this.validateCredentials(context.credentials);

      const google = createGoogleGenerativeAI({
        apiKey: credentials.apiKey,
      });

      const result = await withTimeout(async (signal) => {
        return generateText({
          model: google.languageModel(request.model),
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
        raw: result,
      };
    } catch (error) {
      const normalizedError = GeminiErrorMapper.map(error);

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
  ): GeminiCredentials {
    if (credentials.provider !== ProviderType.GEMINI) {
      throw new Error('Invalid Gemini credentials');
    }

    return credentials;
  }
}
