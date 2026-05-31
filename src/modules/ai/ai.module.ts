import { Module, OnModuleInit } from '@nestjs/common';
import { GeminiAdapter } from './llm-adapter/gemini.adapter';
import { OllamaAdapter } from './llm-adapter/ollama.adapter';
import { LlmProviderRegistry } from './registry/llm-provider-registry.service';
import { LlmObservabilityService } from './service/llm-observability.service';
import { LlmRetryService } from './service/llm-retry.service';
import { NvidiaAdapter } from './llm-adapter/nvidia.adapter';
import { LlmService } from './service/llm-call.service';
import { RequestContextModule } from '../request-context/request-context.module';
import { AiTools } from './tools/file-fetch-tool.service';

@Module({
  imports: [RequestContextModule],
  providers: [
    GeminiAdapter,
    OllamaAdapter,
    NvidiaAdapter,
    LlmProviderRegistry,
    LlmObservabilityService,
    LlmRetryService,
    LlmService,
    AiTools,
  ],
  exports: [LlmService],
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
