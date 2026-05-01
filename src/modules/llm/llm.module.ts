import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmProviderCredential } from './entity/llm-provider-credential.entity';
import { LLMProvider } from './entity/llm-provider.entity';
import { EncryptionService } from './service/encryption.service';
import { CredentialService } from './service/credential.service';
import { ProviderValidationService } from './service/provider-validation.service';
import { LlmProviderService } from './service/llm-provider.service';
import { LlmProviderController } from './controller/llm-provider.controller';

@Module({
    imports: [TypeOrmModule.forFeature([LLMProvider, LlmProviderCredential])],
    controllers: [LlmProviderController],
    providers: [EncryptionService,CredentialService, ProviderValidationService, LlmProviderService],
})
export class LlmModule {}
