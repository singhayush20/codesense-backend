import { Injectable, Logger } from '@nestjs/common';
import { PrAnalyzerDto } from '../../../dto/queue-payload/pr-analyzer-payload.dto';
import { LlmService } from '../../../../llm/service/llm-call.service';
import { PrCodeParsingService } from '../pr-code-parsing/pr-code-parsing.service';
import { PullRequestQueryService } from '../../query/pull-request-query/pull-request-query.service';
import { RepoLlmConfigService } from '../../../../llm/service/repo-llm-config.service';
import { CredentialService } from '../../../../llm/service/credential.service';
import { LlmExecutionContext } from '../../../../ai/dto/execution-context.dto';
import { LlmRequest } from '../../../../ai/dto/llm-request.dto';
import { ProviderCredentials } from '../../../../ai/dto/provider-credentials.dto';
import { LlmCallRequestDto } from '../../../../llm/dtos/llm-call-request.dto';

@Injectable()
export class AiReviewService {
  private readonly logger = new Logger(AiReviewService.name);

  constructor(
    private readonly llmCallService: LlmService,
    private readonly prCodeParsingService: PrCodeParsingService,
    private readonly pullRequestQueryService: PullRequestQueryService,
    private readonly repoLlmConfig: RepoLlmConfigService,
    private readonly credentialService: CredentialService,
  ) {}

  // this is a temporary method to test the integration of different modules and the flow. The actual implementation will be different and will be based on the requirements of the AI review feature
  async handleAiReview(prPayload: PrAnalyzerDto): Promise<void> {
    this.logger.log(`Processing pr analyzer job: ${prPayload.pullRequestId}`);

    const repositoryId = prPayload.repositoryId.toString();
    const pullRequestId = prPayload.pullRequestId;

    if (!repositoryId || !pullRequestId) {
      this.logger.warn(`PR not found: ${prPayload.pullRequestId}`);
      return;
    }

    const pullRequest =
      await this.pullRequestQueryService.findById(pullRequestId);

    if (!pullRequest) {
      this.logger.warn(`PR not found: ${prPayload.pullRequestId}`);
      return;
    }

    // const prTitle = pullRequest.title;
    // const body = pullRequest.body;
    const isMerged = pullRequest.isMerged;
    // const headBranch = pullRequest.headBranch;

    if (isMerged) {
      this.logger.warn(
        `PR already merged: ${prPayload.pullRequestId}. Therefore, skipping review`,
      );
      return;
    }

    const llmConfig =
      await this.repoLlmConfig.getRepoLlmConfigByRepositoryId(repositoryId);

    const decryptedLlmCredentials =
      await this.credentialService.getDecryptedConfigByProviderId(
        llmConfig.providerId,
      );

    if (
      !llmConfig ||
      llmConfig.isActive === false ||
      !llmConfig.isValid ||
      !llmConfig.model
    ) {
      this.logger.warn(
        `LLM config for the repository is not available for use: ${repositoryId}. Therefore, skipping review`,
      );
      return;
    }

    const model = llmConfig.model;
    const provider = llmConfig.providerType;

    // const fileContext =
    //   await this.prCodeParsingService.generateContextFromPullRequest(
    //     pullRequestId,
    //   );

    const llmRequest: LlmRequest = {
      model: model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Who constructed Eiffiel Tower',
            },
          ],
        },
      ],
      temperature: 0.7,
      maxTokens: 1000,
      topP: 0.9,
      stream: false,
    };

    const providerCredentials: ProviderCredentials = {
      apiKey: decryptedLlmCredentials.apiKey,
      baseUrl: decryptedLlmCredentials.baseUrl,
      provider: provider,
    };

    const llmProviderConfig: LlmExecutionContext = {
      credentials: providerCredentials,
    };

    const llmCallRequest: LlmCallRequestDto = {
      providerType: provider,
      request: llmRequest,
      context: llmProviderConfig,
    };

    const llmResponse = await this.llmCallService.generate(
      llmCallRequest.providerType,
      llmCallRequest.request,
      llmCallRequest.context,
    );

    this.logger.log(
      `LLM response for PR ${pullRequestId}: ${JSON.stringify(llmResponse)}`,
    );
  }
}
