import { ProviderType } from '../enums/provider.type';

export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface LlmResponse {
  provider: ProviderType;

  model: string;

  text: string;

  finishReason?: string;

  usage?: TokenUsage;

  raw?: unknown;
}
