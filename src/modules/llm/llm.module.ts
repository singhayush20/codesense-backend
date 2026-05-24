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
import { AiModule } from '../ai/ai.module';
import { LlmCallsController } from './controller/llm-calls/llm-calls.controller';
import { LlmService } from './service/llm-call.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LLMProvider,
      LlmProviderCredential,
      RepoLlmConfig,
    ]),
    GithubIntegrationModule,
    AiModule,
  ],
  controllers: [
    LlmProviderController,
    RepoLlmConfigController,
    LlmCallsController,
  ],
  providers: [
    EncryptionService,
    CredentialService,
    ProviderValidationService,
    LlmProviderService,
    RepoLlmConfigService,
    LlmService,
  ],
})
export class LlmModule {}
