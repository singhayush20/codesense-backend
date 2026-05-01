import { Injectable } from '@nestjs/common';
import { ProviderType } from '../enums/provider.type';

@Injectable()
export class ProviderValidationService {
  async validate(
    providerType: ProviderType,
    config: Record<string, any>,
  ): Promise<boolean> {
    switch (providerType) {
      case ProviderType.OPENAI:
        return this.validateOpenAI(config.apiKey);

      // extend later
      default:
        return true;
    }
  }

  private async validateOpenAI(apiKey: string): Promise<boolean> {
    if (!apiKey) return false;

    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      return res.ok;
    } catch {
      return false;
    }
  }
}
