export class ProviderResponseDto {
  id!: string;

  providerType!: string;

  displayName!: string;

  isActive!: boolean;

  isValid!: boolean;

  keyFingerprint!: string | null;
}
