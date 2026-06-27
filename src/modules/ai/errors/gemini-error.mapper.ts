import { ProviderType } from '../enums/provider.type';
import {
  LlmAuthenticationError,
  LlmCancelledError,
  LlmInternalError,
  LlmProviderError,
  LlmRateLimitError,
} from './llm-provider.error';

export class GeminiErrorMapper {
  static map(error: unknown): Error {
    if (error instanceof Error && error.name === 'AbortError') {
      return new LlmCancelledError(
        'Gemini request was cancelled',
        ProviderType.GEMINI,
        false,
        error,
      );
    }

    const message =
      error instanceof Error ? error.message : 'Unknown Gemini error';

    const normalizedMessage = message.toLowerCase();

    if (
      normalizedMessage.includes('api key') ||
      normalizedMessage.includes('authentication') ||
      normalizedMessage.includes('unauthorized')
    ) {
      return new LlmAuthenticationError(
        message,
        ProviderType.GEMINI,
        false,
        error,
      );
    }

    if (
      normalizedMessage.includes('rate limit') ||
      normalizedMessage.includes('quota')
    ) {
      return new LlmRateLimitError(message, ProviderType.GEMINI, true, error);
    }

    if (
      normalizedMessage.includes('500') ||
      normalizedMessage.includes('503')
    ) {
      return new LlmInternalError(message, ProviderType.GEMINI, true, error);
    }

    return new LlmProviderError(message, ProviderType.GEMINI, false, error);
  }
}
