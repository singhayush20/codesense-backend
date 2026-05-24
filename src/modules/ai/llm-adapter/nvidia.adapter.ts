import { Injectable, Logger } from '@nestjs/common';
import { generateText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { LlmExecutionContext } from '../dto/execution-context.dto';
import { LlmRequest } from '../dto/llm-request.dto';
import { LlmResponse } from '../dto/llm-response.dto';
import { NvidiaCredentials } from '../dto/provider-credentials.dto';
import { ProviderType } from '../enums/provider.type';
import { AiSdkMessageMapper } from '../mapper/ai-message.mapper';
import { withTimeout } from '../util/llm-request-timeout.util';
import { LlmProviderAdapter } from './llm.adapter';
import { NvidiaErrorMapper } from '../errors/nvidia-error.mapper';

@Injectable()
export class NvidiaAdapter implements LlmProviderAdapter {
  private readonly logger = new Logger(NvidiaAdapter.name);
  private static readonly authHeaderPrefix = 'Bearer ';
  private static readonly nvidiaBaseUrl = 'https://integrate.api.nvidia.com/v1';
  private static readonly nvidiaNim = 'nim';

  readonly provider = ProviderType.NVIDIA;

  async generate(
    request: LlmRequest,

    context: LlmExecutionContext,
  ): Promise<LlmResponse> {
    try {
      const credentials = this.validateCredentials(context.credentials);

      const nvidia = createOpenAICompatible({
        name: NvidiaAdapter.nvidiaNim,
        headers: {
          Authorization: `${NvidiaAdapter.authHeaderPrefix}${credentials.apiKey}`,
        },
        baseURL: NvidiaAdapter.nvidiaBaseUrl,
      });

      const result = await withTimeout(async (signal) => {
        return generateText({
          model: nvidia.chatModel(request.model),
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
      const normalizedError = NvidiaErrorMapper.map(error);

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
  ): NvidiaCredentials {
    if (credentials.provider !== ProviderType.NVIDIA) {
      throw new Error('Invalid NVIDIA credentials');
    }

    return credentials;
  }
}
