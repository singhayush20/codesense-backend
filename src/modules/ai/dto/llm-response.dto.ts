import { ProviderType } from '../enums/provider.type';

export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface LlmResponse<TResponse = string> {
  provider: ProviderType;

  model: string;

  response: TResponse; // this needs to be of the proper structured output type schemaToUse

  finishReason?: string;

  usage?: TokenUsage;

  raw?: unknown;
}
