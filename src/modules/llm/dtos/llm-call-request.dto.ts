import { IsNotEmpty, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ProviderType } from '../../ai/enums/provider.type';
import { LlmRequest } from '../../ai/dto/llm-request.dto';
import { LlmExecutionContext } from '../../ai/dto/execution-context.dto';

export class LlmCallRequestDto {
  @IsEnum(ProviderType, {
    message: `Provider type must be one of: ${Object.values(ProviderType).join(', ')}`,
  })
  @IsNotEmpty({ message: "Provider type can't be empty" })
  providerType!: ProviderType;

  @IsNotEmpty({ message: "Request can't be empty" })
  @ValidateNested({ always: true })
  @Type(() => LlmRequest)
  request!: LlmRequest;

  @IsNotEmpty({ message: "Context can't be empty" })
  @ValidateNested({ always: true })
  @Type(() => LlmExecutionContext)
  context!: LlmExecutionContext;
}
