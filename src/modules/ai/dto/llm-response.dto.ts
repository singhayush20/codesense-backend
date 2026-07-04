import { ProviderType } from '../enums/provider.type';
import { AIReviewComment } from '../schema/ai-review-comment.schema';

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

  toolUsage?: {
    calls?: unknown[];
    results?: unknown[];
  };
}

export interface LlmResponseDto {
  totalTokenUsage?: number;
  totalInputTokens?: number;
  totalOutputTokens?: number;
  model?: string;
  provider?: ProviderType;
  consolidatedSummary?: string;
  comments?: AIReviewComment[];
}
