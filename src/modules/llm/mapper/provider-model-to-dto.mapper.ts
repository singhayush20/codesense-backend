import { LLMProvider } from '../entity/llm-provider.entity';
import { ProviderResponseDto } from '../dtos/provider-response.dto';

export class ProviderMapper {
  static toDto(p: LLMProvider): ProviderResponseDto {
    return {
      id: p.publicId,
      providerType: p.providerType,
      displayName: p.displayName,
      isActive: p.isActive,
      isValid: p.credential?.isValid ?? false,
      keyFingerprint: p.credential?.keyFingerprint ?? null,
    };
  }
}
