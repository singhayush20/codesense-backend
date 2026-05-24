import { Injectable, Logger } from '@nestjs/common';
import pRetry from 'p-retry';
import {
  LlmAuthenticationError,
  LlmValidationError,
} from '../errors/llm-provider.error';

@Injectable()
export class LlmRetryService {
  private readonly logger = new Logger(LlmRetryService.name);

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    return pRetry(operation, {
      retries: 3,
      factor: 2,
      minTimeout: 500,
      maxTimeout: 5000,
      randomize: true,
      onFailedAttempt: (error) => {
        this.logger.error(
          `LLM request failed | attempt=${error.attemptNumber} | error=${error.error.message}`,
        );
      },
      shouldRetry: ({ error }) => {
        if (error instanceof LlmAuthenticationError) {
          return false;
        }

        if (error instanceof LlmValidationError) {
          return false;
        }

        return true;
      },
    });
  }
}
