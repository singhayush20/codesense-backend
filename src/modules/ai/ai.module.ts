import { Module, OnModuleInit } from '@nestjs/common';
import { GeminiAdapter } from './llm-adapter/gemini.adapter';
import { OllamaAdapter } from './llm-adapter/ollama.adapter';
import { LlmProviderRegistry } from './registry/llm-provider.registry';
import { LlmObservabilityService } from './service/llm-observability.service';
import { LlmRetryService } from './service/llm-retry.service';
import { LlmRequestValidatorService } from './service/request-validator.service';
import { NvidiaAdapter } from './llm-adapter/nvidia.adapter';

@Module({
  providers: [
    GeminiAdapter,
    OllamaAdapter,
    NvidiaAdapter,
    LlmProviderRegistry,
    LlmObservabilityService,
    LlmRetryService,
    LlmRequestValidatorService,
  ],
  exports: [
    LlmProviderRegistry,
    LlmObservabilityService,
    LlmRetryService,
    LlmRequestValidatorService,
  ],
})
export class AiModule implements OnModuleInit {
  constructor(
    private readonly registry: LlmProviderRegistry,
    private readonly geminiAdapter: GeminiAdapter,
    private readonly ollamaAdapter: OllamaAdapter,
    private readonly nvidiaAdapter: NvidiaAdapter,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.geminiAdapter);
    this.registry.register(this.ollamaAdapter);
    this.registry.register(this.nvidiaAdapter);
  }
}
