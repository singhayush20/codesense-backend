import { LlmResponseDto } from '../../../ai/dto/llm-response.dto';
import { ProviderType } from '../../../ai/enums/provider.type';

export interface ReviewResultsPayloadDto {
  runId: string;

  provider: ProviderType;

  pullRequestId: string;

  githubRepositoryId: string;

  result: LlmResponseDto;
}
