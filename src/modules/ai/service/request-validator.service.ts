import { Injectable } from '@nestjs/common';
import { llmRequestSchema } from '../schema/llm-request.schema';
import { LlmRequest } from '../dto/llm-request.dto';

@Injectable()
export class LlmRequestValidatorService {
  validate(request: LlmRequest): LlmRequest {
    return llmRequestSchema.parse(request);
  }
}
