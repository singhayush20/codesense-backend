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
import { z } from 'zod';

export class LlmRequest<TSchema extends z.ZodTypeAny | undefined = undefined> {
  @IsString({ message: 'Model must be a string' })
  @IsNotEmpty({ message: "Model can't be empty" })
  model!: string;

  @IsString({ message: 'System prompt must be a string' })
  @IsNotEmpty({ message: "System prompt can't be empty" })
  systemPrompt!: string;

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

  responseSchema?: TSchema;

  @IsString({ message: 'Repository full name must be a string' })
  @IsNotEmpty({ message: "Repository full name can't be empty" })
  repositoryFullName?: string;

  @IsString({ message: 'Installation ID must be a string' })
  @IsNotEmpty({ message: "Installation ID can't be empty" })
  installationId?: string;

  @IsNumber(
    { allowNaN: false },
    { message: 'Pull request number must be a number' },
  )
  @IsNotEmpty({ message: "Pull request number can't be empty" })
  pullRequestNumber?: number;

  @IsString({ message: 'Head branch SHA must be a string' })
  @IsNotEmpty({ message: "Head branch SHA can't be empty" })
  headBranchSha?: string;
}
