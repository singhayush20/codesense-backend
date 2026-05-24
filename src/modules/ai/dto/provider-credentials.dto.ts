import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ProviderType } from '../enums/provider.type';

export class GeminiCredentials {
  @IsEnum([ProviderType.GEMINI], { message: "Provider must be 'gemini'" })
  @IsNotEmpty({ message: "Provider can't be empty" })
  provider!: ProviderType.GEMINI;

  @IsString({ message: 'API key must be a string' })
  @IsNotEmpty({ message: "API key can't be empty" })
  apiKey!: string;
}

export class OllamaCredentials {
  @IsEnum([ProviderType.OLLAMA], { message: "Provider must be 'ollama'" })
  @IsNotEmpty({ message: "Provider can't be empty" })
  provider!: ProviderType.OLLAMA;

  @IsString({ message: 'Base URL must be a string' })
  @IsNotEmpty({ message: "Base URL can't be empty" })
  baseUrl!: string;
}

export class NvidiaCredentials {
  @IsEnum([ProviderType.NVIDIA], { message: "Provider must be 'nvidia'" })
  @IsNotEmpty({ message: "Provider can't be empty" })
  provider!: ProviderType.NVIDIA;

  @IsString({ message: 'API key must be a string' })
  @IsNotEmpty({ message: "API key can't be empty" })
  apiKey!: string;
}

export type ProviderCredentials =
  | GeminiCredentials
  | OllamaCredentials
  | NvidiaCredentials;
