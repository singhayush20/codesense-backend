import { ProviderType } from '../../ai/enums/provider.type';

export class RepoLlmConfigResponseDto {
  repoId!: string;

  providerId!: string;

  providerType!: ProviderType;

  displayName!: string;

  model!: string;

  isActive!: boolean;

  isValid!: boolean;
}
