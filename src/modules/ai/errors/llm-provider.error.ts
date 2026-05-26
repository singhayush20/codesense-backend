export class LlmProviderError extends Error {
  constructor(
    message: string,

    public readonly provider: string,

    public readonly retryable: boolean,

    public readonly cause?: unknown,
  ) {
    super(message);
  }
}

export class LlmAuthenticationError extends LlmProviderError {}

export class LlmRateLimitError extends LlmProviderError {}

export class LlmTimeoutError extends LlmProviderError {}

export class LlmValidationError extends LlmProviderError {}

export class LlmInternalError extends LlmProviderError {}
