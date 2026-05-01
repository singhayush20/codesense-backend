import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmProviderCredential } from './entity/llm-provider-credential.entity';
import { LLMProvider } from './entity/llm-provider.entity';
import { EncryptionService } from './service/encryption.service';
import { CredentialService } from './service/credential.service';
import { ProviderValidationService } from './service/provider-validation.service';
import { LlmProviderService } from './service/llm-provider.service';
import { LlmProviderController } from './controller/llm-provider.controller';
import { RepoLlmConfig } from './entity/repo-llm-config.entity';
import { GithubIntegrationModule } from '../github-integration/github-integration.module';
import { RepoLlmConfigService } from './service/repo-llm-config.service';
import { RepoLlmConfigController } from './controller/repo-llm-config.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LLMProvider,
      LlmProviderCredential,
      RepoLlmConfig,
    ]),
    GithubIntegrationModule,
  ],
  controllers: [LlmProviderController, RepoLlmConfigController],
  providers: [
    EncryptionService,
    CredentialService,
    ProviderValidationService,
    LlmProviderService,
    RepoLlmConfigService,
  ],
})
export class LlmModule {}
