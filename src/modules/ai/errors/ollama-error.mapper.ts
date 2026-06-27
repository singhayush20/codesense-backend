import { ProviderType } from '../enums/provider.type';
import {
  LlmCancelledError,
  LlmInternalError,
  LlmProviderError,
} from './llm-provider.error';

export class OllamaErrorMapper {
  static map(error: unknown): Error {
    if (error instanceof Error && error.name === 'AbortError') {
      return new LlmCancelledError(
        'Ollama request was cancelled',
        ProviderType.OLLAMA,
        false,
        error,
      );
    }

    const message =
      error instanceof Error ? error.message : 'Unknown Ollama error';

    const normalizedMessage = message.toLowerCase();

    if (
      normalizedMessage.includes('fetch failed') ||
      normalizedMessage.includes('econnrefused')
    ) {
      return new LlmInternalError(
        'Unable to connect to Ollama server',
        ProviderType.OLLAMA,
        true,
        error,
      );
    }

    return new LlmProviderError(message, ProviderType.OLLAMA, false, error);
  }
}
