import { LlmExecutionContext } from '../dto/execution-context.dto';
import { LlmRequest } from '../dto/llm-request.dto';
import { LlmResponse } from '../dto/llm-response.dto';
import { ProviderType } from '../enums/provider.type';

export interface LlmProviderAdapter {
  readonly provider: ProviderType;

  generate(
    request: LlmRequest,
    context: LlmExecutionContext,
  ): Promise<LlmResponse>;
}
