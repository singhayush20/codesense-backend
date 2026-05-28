// llm-execution-context.dto.ts
import {
  IsNotEmpty,
  ValidateNested,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';
import { Type, TypeHelpOptions } from 'class-transformer';
import { ProviderType } from '../enums/provider.type';
import {
  GeminiCredentials,
  NvidiaCredentials,
  OllamaCredentials,
  OpenAICredentials,
  BedrockCredentials,
  AnthropicCredentials,
} from './provider-credentials.dto';
import type { ProviderCredentials } from './provider-credentials.dto';

export class LlmExecutionContext {
  @IsNotEmpty({ message: "Credentials can't be empty" })
  @ValidateNested({ always: true })
  @Type((opts?: TypeHelpOptions) => {
    // Cast the root payload container safely
    const rootPayload = opts?.object as Record<string, unknown> | undefined;

    // Extract the credentials sub-object safely
    const credentialsObj = rootPayload?.credentials as
      | Record<string, unknown>
      | undefined;

    // Extract the actual "provider" key from inside the credentials object
    const provider = credentialsObj?.provider;

    if (provider === ProviderType.GEMINI || provider === 'gemini') {
      return GeminiCredentials;
    } else if (provider === ProviderType.OLLAMA || provider === 'ollama') {
      return OllamaCredentials;
    } else if (provider === ProviderType.NVIDIA || provider === 'nvidia') {
      return NvidiaCredentials;
    } else if (provider === ProviderType.OPENAI || provider === 'openai') {
      return OpenAICredentials;
    } else if (provider === ProviderType.BEDROCK || provider === 'bedrock') {
      return BedrockCredentials;
    } else if (
      provider === ProviderType.ANTHROPIC ||
      provider === 'anthropic'
    ) {
      return AnthropicCredentials;
    }

    return Object;
  })
  credentials!: ProviderCredentials;

  @IsOptional()
  @IsNumber({}, { message: 'Timeout must be a number' })
  timeoutMs?: number;

  @IsOptional()
  @IsString({ message: 'Request ID must be a string' })
  requestId?: string;
}
