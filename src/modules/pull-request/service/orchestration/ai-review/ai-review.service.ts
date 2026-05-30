import { Injectable, Logger } from '@nestjs/common';
import { PrAnalyzerDto } from '../../../dto/queue-payload/pr-analyzer-payload.dto';
import { LlmService } from '../../../../ai/service/llm-call.service';
import { PrCodeParsingService } from '../pr-code-parsing/pr-code-parsing.service';
import { PullRequestQueryService } from '../../query/pull-request-query/pull-request-query.service';
import { RepoLlmConfigService } from '../../../../llm/service/repo-llm-config.service';
import { CredentialService } from '../../../../llm/service/credential.service';
import { LlmExecutionContext } from '../../../../ai/dto/execution-context.dto';
import { LlmRequest } from '../../../../ai/dto/llm-request.dto';
import { ProviderCredentials } from '../../../../ai/dto/provider-credentials.dto';
import {
  FileContextDto,
  PullRequestMetadataDto,
  PullRequestReviewContextDto,
} from '../../../dto/review/pr-review-context.dto';
import { CODE_REVIEW_SYSTEM_PROMPT } from '../../../util/prompt-utils';
import { RepoLlmConfigResponseDto } from '../../../../llm/dtos/repo-llm-config-response.dto';
import {
  LlmResponse,
  LlmResponseDto,
} from '../../../../ai/dto/llm-response.dto';
import { z } from 'zod';
import {
  AIReviewComment,
  AIReviewResponse,
  AIReviewResponseSchema,
} from '../../../../ai/schema/ai-review-comment.scehma';

@Injectable()
export class AiReviewService {
  private readonly logger = new Logger(AiReviewService.name);

  // Balance between context concentration and performance token consumption
  private readonly MAX_FILES_PER_BATCH = 3;

  constructor(
    private readonly llmCallService: LlmService,
    private readonly prCodeParsingService: PrCodeParsingService,
    private readonly pullRequestQueryService: PullRequestQueryService,
    private readonly repoLlmConfig: RepoLlmConfigService,
    private readonly credentialService: CredentialService,
  ) {}

  async handleAiReview(prPayload: PrAnalyzerDto): Promise<LlmResponseDto> {
    const repositoryId = prPayload.repositoryId.toString();
    const pullRequestId = prPayload.pullRequestId;

    this.logger.log(
      `Handling ai review for PR: ${pullRequestId}, repositoryId: ${repositoryId}`,
    );

    if (!repositoryId || !pullRequestId) {
      this.logger.warn(
        `Missing repositoryId or pullRequestId for job metadata.`,
      );
      return {};
    }

    const pullRequest =
      await this.pullRequestQueryService.findById(pullRequestId);
    if (!pullRequest) {
      this.logger.warn(
        `PR entity records not found in database: ${pullRequestId}`,
      );
      return {};
    }

    if (pullRequest.isMerged) {
      this.logger.warn(
        `PR ${pullRequestId} already merged. Skipping review sequence.`,
      );
      return {};
    }

    const llmConfig =
      await this.repoLlmConfig.getRepoLlmConfigByRepositoryId(repositoryId);
    if (
      !llmConfig ||
      llmConfig.isActive === false ||
      !llmConfig.isValid ||
      !llmConfig.model
    ) {
      this.logger.warn(
        `LLM config for repository ${repositoryId} is inactive or invalid. Skipping review.`,
      );
      return {};
    }

    const decryptedLlmCredentials =
      await this.credentialService.getDecryptedConfigByProviderId(
        llmConfig.providerId,
      );

    const fileContext: PullRequestReviewContextDto =
      await this.prCodeParsingService.generateContextFromPullRequest(
        pullRequestId,
      );

    if (!fileContext.files || fileContext.files.length === 0) {
      this.logger.log(
        `No applicable code modifications found for review in PR ${pullRequestId}`,
      );
      return {};
    }

    const providerCredentials: ProviderCredentials = {
      apiKey: decryptedLlmCredentials.apiKey,
      baseUrl: decryptedLlmCredentials.baseUrl,
      provider: llmConfig.providerType,
    };

    const fileBatches = this.chunkFiles(
      fileContext.files,
      this.MAX_FILES_PER_BATCH,
    );

    this.logger.log(
      `PR ${pullRequestId} split into ${fileBatches.length} review execution batches.`,
    );

    const reviewPromises = fileBatches.map((batchFiles, index) => {
      this.logger.log(
        `Initiating review for batch #${index + 1} with ${batchFiles.length} files for PR ${pullRequestId}.`,
      );

      const llmProviderConfig: LlmExecutionContext = {
        credentials: providerCredentials,
        requestId: `repoId:${repositoryId} | prId:${pullRequestId} | batch:${index + 1} | ${Date.now()}`,
      };

      return this.reviewFileBatch(
        batchFiles,
        fileContext.prMetadata,
        llmConfig,
        llmProviderConfig,
        index + 1,
      );
    });

    const batchResults = await Promise.all(reviewPromises);

    const finalReview = this.consolidateBatchReviews(batchResults);

    this.logger.log(
      `Successfully completed code analysis processing for PR ${pullRequestId}. Found ${finalReview.comments.length} items.`,
    );

    // TODO: Enque the response for persistence and posting comments asynchronously using a queue

    return { response: finalReview };
  }

  private chunkFiles(
    files: FileContextDto[],
    size: number,
  ): FileContextDto[][] {
    const chunks: FileContextDto[][] = [];
    for (let i = 0; i < files.length; i += size) {
      chunks.push(files.slice(i, i + size));
    }

    this.logger.log(
      `Splitting PR files into ${chunks.length} review execution batches.`,
    );
    return chunks;
  }

  private async reviewFileBatch(
    files: FileContextDto[],
    metadata: PullRequestMetadataDto,
    llmConfig: RepoLlmConfigResponseDto,
    providerConfig: LlmExecutionContext,
    batchId: number,
  ): Promise<AIReviewResponse | null> {
    this.logger.debug(`Executing batch evaluation pass #${batchId}`);

    const userPromptText = `
Analyze the structural code modifications for this designated batch segment.
Review the code changes with strict isolation principles.

PR General Scope:
- Title: ${metadata.title}
- Intent: ${metadata.body}

Target Batch Files to Evaluate:
${JSON.stringify(files, null, 2)}
`;

    const llmRequest: LlmRequest<typeof AIReviewResponseSchema> = {
      model: llmConfig.model,
      systemPrompt: CODE_REVIEW_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: userPromptText }],
        },
      ],
      temperature: 0.1,
      maxTokens: 3000,
      topP: 0.9,
      stream: false,
      responseSchema: AIReviewResponseSchema,
    };

    try {
      const response: LlmResponse<z.infer<typeof AIReviewResponseSchema>> =
        await this.llmCallService.generate(
          llmConfig.providerType,
          llmRequest,
          providerConfig,
        );

      // Access the provider-agnostic response text property directly from your custom interface
      const responseText = response.response;

      if (!responseText) {
        throw new Error(
          'Received an empty text payload from the underlying LLM provider adapter.',
        );
      }

      return response.response;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Critical parsing error encountered on batch processing step #${batchId}: ${errorMessage}`,
      );

      return null;
    }
  }

  private consolidateBatchReviews(
    results: (AIReviewResponse | null)[],
  ): AIReviewResponse {
    const consolidatedComments: AIReviewComment[] = [];
    const summaryTracks: string[] = [];

    results.forEach((res, i) => {
      if (!res) {
        summaryTracks.push(
          `[Batch ${i + 1}]: Evaluation step encountered an error.`,
        );
        return;
      }

      consolidatedComments.push(...res.comments);
      summaryTracks.push(`[Batch ${i + 1}]: ${res.summary}`);
    });

    return {
      summary: `### AI Code Analysis Review Summary\n\n${summaryTracks.join('\n')}`,
      comments: consolidatedComments,
    };
  }
}
