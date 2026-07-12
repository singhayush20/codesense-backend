import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import pRetry from 'p-retry';
import {
  LlmAuthenticationError,
  LlmCancelledError,
  LlmValidationError,
} from '../errors/llm-provider.error';

@Injectable()
export class LlmRetryService {
  @InjectPinoLogger(LlmRetryService.name)
  private readonly logger: PinoLogger;

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    return pRetry(operation, {
      retries: 1,
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

        if (error instanceof LlmCancelledError) {
          return false;
        }

        return true;
      },
    });
  }
}
