import {
  IsEnum,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export type LlmRole = 'system' | 'user' | 'assistant';

export class TextContent {
  @IsEnum(['text'], { message: 'Content type must be "text"' })
  @IsNotEmpty({ message: "Content type can't be empty" })
  type!: 'text';

  @IsString({ message: 'Text must be a string' })
  @IsNotEmpty({ message: "Text content can't be empty" })
  text!: string;
}

export type LlmContent = TextContent;

export class LlmMessage {
  @IsEnum(['system', 'user', 'assistant'], {
    message: 'Role must be one of "system", "user", or "assistant"',
  })
  @IsNotEmpty({ message: "Role can't be empty" })
  role!: LlmRole;

  @IsArray({ message: 'Content must be an array' })
  @ValidateNested({ each: true, message: 'Each content item must be valid' })
  @Type(() => TextContent)
  @IsNotEmpty({ message: "Content can't be empty" })
  content!: TextContent[];
}
