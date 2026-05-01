import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { LLMProvider } from '../entity/llm-provider.entity';
import { LlmProviderCredential } from '../entity/llm-provider-credential.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ProviderValidationService } from './provider-validation.service';
import * as crypto from 'crypto';
import { EncryptionService } from './encryption.service';
import { AppException } from '../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../exception-handling/exception-codes';
import { ProviderType } from '../enums/provider.type';

@Injectable()
export class CredentialService {
  constructor(
    @InjectRepository(LLMProvider)
    private readonly providerRepo: Repository<LLMProvider>,

    @InjectRepository(LlmProviderCredential)
    private readonly credentialRepo: Repository<LlmProviderCredential>,

    private readonly encryptionService: EncryptionService,
    private readonly validator: ProviderValidationService,
  ) {}

  async addOrUpdateCredentials(
    providerPublicId: string,
    userId: string,
    config: Record<string, any>,
  ): Promise<void> {
    const provider = await this.providerRepo.findOne({
      where: {
        publicId: providerPublicId,
        user: { userId: userId },
      },
    });

    if (!provider) {
      throw new AppException(
        ExceptionCodes.PROVIDER_NOT_FOUND,
        'Provider not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const isValid = await this.validator.validate(
      provider.providerType,
      config,
    );

    const encrypted = this.encryptionService.encrypt(config);

    const fingerprint = this.generateFingerprint(provider.providerType, config);

    let credential = await this.credentialRepo.findOne({
      where: { provider: { id: provider.id } },
    });

    if (!credential) {
      credential = this.credentialRepo.create({
        provider,
        encryptedConfig: encrypted,
        isValid,
        keyFingerprint: fingerprint,
      });
    } else {
      credential.encryptedConfig = encrypted;
      credential.isValid = isValid;
      credential.keyFingerprint = fingerprint;
    }

    await this.credentialRepo.save(credential);
  }

  async getDecryptedConfig(
    providerId: number,
    userId: string,
  ): Promise<Record<string, any>> {
    const credential = await this.credentialRepo.findOne({
      where: {
        provider: {
          id: providerId,
          user: { userId: userId },
        },
      },
      relations: ['provider', 'provider.user'],
    });

    if (!credential) {
      throw new AppException(
        ExceptionCodes.CREDENTIAL_NOT_FOUND,
        'Credential not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.encryptionService.decrypt(credential.encryptedConfig);
  }

  private generateFingerprint(
    providerType: ProviderType,
    config: Record<string, unknown>,
  ): string {
    let keyMaterial: string;

    switch (providerType) {
      case ProviderType.OPENAI:
      case ProviderType.ANTHROPIC:
      case ProviderType.GEMINI:
        keyMaterial = String((config as any).apiKey);
        break;

      case ProviderType.BEDROCK:
        keyMaterial = String((config as any).accessKeyId);
        break;

      case ProviderType.OLLAMA:
        keyMaterial = String((config as any).baseUrl ?? 'local');
        break;

      default:
        keyMaterial = JSON.stringify(config);
    }

    return crypto
      .createHash('sha256')
      .update(keyMaterial)
      .digest('hex')
      .slice(0, 12);
  }
}
