import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { LlmProviderAdapter } from '../llm-adapter/llm.adapter';
import { ProviderType } from '../enums/provider.type';

@Injectable()
export class LlmProviderRegistry {
  private readonly providers = new Map<ProviderType, LlmProviderAdapter>();

  register(provider: LlmProviderAdapter): void {
    this.providers.set(provider.provider, provider);
  }

  get(provider: ProviderType): LlmProviderAdapter {
    const adapter = this.providers.get(provider);

    if (!adapter) {
      throw new InternalServerErrorException(`Provider ${provider} not found`);
    }

    return adapter;
  }
}
