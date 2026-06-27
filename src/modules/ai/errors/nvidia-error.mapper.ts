import { ProviderType } from '../enums/provider.type';

import {
  LlmAuthenticationError,
  LlmCancelledError,
  LlmInternalError,
  LlmProviderError,
  LlmRateLimitError,
} from './llm-provider.error';

export class NvidiaErrorMapper {
  static map(error: unknown): Error {
    if (error instanceof Error && error.name === 'AbortError') {
      return new LlmCancelledError(
        'NVIDIA request was cancelled',
        ProviderType.NVIDIA,
        false,
        error,
      );
    }

    const message =
      error instanceof Error ? error.message : 'Unknown NVIDIA error';

    const normalizedMessage = message.toLowerCase();

    if (
      normalizedMessage.includes('unauthorized') ||
      normalizedMessage.includes('api key') ||
      normalizedMessage.includes('authentication')
    ) {
      return new LlmAuthenticationError(
        message,
        ProviderType.NVIDIA,
        false,
        error,
      );
    }

    if (
      normalizedMessage.includes('rate limit') ||
      normalizedMessage.includes('quota')
    ) {
      return new LlmRateLimitError(message, ProviderType.NVIDIA, true, error);
    }

    if (
      normalizedMessage.includes('500') ||
      normalizedMessage.includes('503')
    ) {
      return new LlmInternalError(message, ProviderType.NVIDIA, true, error);
    }

    return new LlmProviderError(message, ProviderType.NVIDIA, false, error);
  }
}
