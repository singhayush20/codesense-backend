import {
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { LlmMessage } from './llm-message.dto';
import { Type } from 'class-transformer';

export class LlmRequest {
  @IsString({ message: 'Model must be a string' })
  @IsNotEmpty({ message: "Model can't be empty" })
  model!: string;

  @IsArray({ message: 'Messages must be an array' })
  @ValidateNested({ each: true, always: true })
  @Type(() => LlmMessage)
  @IsNotEmpty({ message: "Messages can't be empty" })
  messages!: LlmMessage[];

  @IsNumber({}, { message: 'Temperature must be a number' })
  @Min(0, { message: 'Temperature must be at least 0' })
  @Max(2, { message: 'Temperature must be at most 2' })
  temperature?: number;

  @IsNumber({}, { message: 'Max tokens must be a number' })
  @Min(1, { message: 'Max tokens must be at least 1' })
  maxTokens?: number;

  @IsNumber({}, { message: 'Top P must be a number' })
  @Min(0, { message: 'Top P must be at least 0' })
  @Max(1, { message: 'Top P must be at most 1' })
  topP?: number;

  @IsBoolean({ message: 'Stream must be a boolean' })
  stream?: boolean;
}
