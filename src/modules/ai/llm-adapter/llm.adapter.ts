import { ToolSet } from 'ai';
import { LlmExecutionContext } from '../dto/execution-context.dto';
import { LlmRequest } from '../dto/llm-request.dto';
import { LlmResponse } from '../dto/llm-response.dto';
import { ProviderType } from '../enums/provider.type';
import { z } from 'zod';

export interface LlmProviderAdapter {
  readonly provider: ProviderType;

  generate<TSchema extends z.ZodTypeAny | undefined = undefined>(
    request: LlmRequest<TSchema>,
    context: LlmExecutionContext,
    toolSet: ToolSet,
  ): Promise<
    LlmResponse<TSchema extends z.ZodTypeAny ? z.infer<TSchema> : string>
  >;
}
