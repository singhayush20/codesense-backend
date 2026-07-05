import { forwardRef, Module } from '@nestjs/common';
import { PullRequestReviewJob } from './entity/pull-request-review-job.entity';
import { PullRequest } from './entity/pull-request.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PullRequestFile } from './entity/pull-request-file.entity';
import { GithubIntegrationModule } from '../github-integration/github-integration.module';
import { HttpModule } from '@nestjs/axios';
import { PrWorkflowService } from './service/orchestration/pr-workflow/pr-workflow.service';
import { GithubPrApiService } from './service/github/github-pr-api/github-pr-api.service';
import { PullRequestSyncService } from './service/sync/pull-request-sync/pull-request-sync.service';
import { PullRequestFileSyncService } from './service/sync/pull-request-file-sync/pull-request-file-sync.service';
import { PullRequestLockService } from './service/sync/pull-request-lock/pull-request-lock.service';
import { PrValidationService } from './service/validation/pr-validation/pr-validation.service';
import { CacheModule } from '../../cache/cache.module';
import { PrFileFilterService } from './service/validation/filter/pr-file-filter/pr-file-filter.service';
import { BullModule } from '@nestjs/bullmq';
import { GithubPrFileContentService } from './service/github/github-pr-file-content/github-pr-file-content.service';
import { RepositoryFileContentSyncService } from './service/sync/repository-file-content-sync/repository-file-content-sync.service';
import { SnapshotCleanupService } from './service/sync/snapshot-cleanup/snapshot-cleanup.service';
import { SnapshotCleanupCron } from './cron/snapshot-cleanup.cron';
import { PullRequestFileSnapshot } from './entity/pull-request-file-snapshot.entity';
import { PullRequestQueryService } from './service/query/pull-request-query/pull-request-query.service';
import { PullRequestFileQueryService } from './service/query/pull-request-file-query/pull-request-file-query.service';
import { PullRequestQueryController } from './controller/pull-request-query/pull-request-query.controller';
import { PrContextBuilderService } from './service/context-builder/context-builder.service';
import { PrCodeParsingService } from './service/orchestration/pr-code-parsing/pr-code-parsing.service';
import { CodeParserController } from './controller/code-parser/code-parser.controller';
import { AiReviewService } from './service/orchestration/ai-review/ai-review.service';
import { AiModule } from '../ai/ai.module';
import { LlmModule } from '../llm/llm.module';
import { PullRequestAnalyzerProcessor } from './processor/pull-request-analyzer.processor';
import { PrToolsUtilityService } from './service/pr-tools-utility/pr-tools-utility.service';
import { PrReviewResultService } from './service/orchestration/pr-review-result/pr-review-result.service';
import { PullRequestReviewService } from './service/pull-request-review/pull-request-review.service';
import { ReviewCancellationService } from './service/orchestration/ai-review/review-cancellation.service';
import { PullRequestReviewJobResult } from './entity/pull-request-review-job-result.entity';
import { GithubPrReviewCommentService } from './service/github/github-pr-review-comment/github-pr-review-comment.service';
import { PullRequestReviewResultsProcessor } from './processor/pull-request-review-resuls.processor';
import { PullRequestReviewStep } from './entity/pull-request-review-step.entity';
import { ReviewWorkflowService } from './service/orchestration/review-workflow/review-workflow.service';
import { ReviewWorkflowEventService } from './service/orchestration/review-workflow/review-workflow-event.service';
import { ReviewWorkflowQueryService } from './service/query/review-workflow-query/review-workflow-query.service';
import { ReviewRunWorkflowController } from './controller/review-run-workflow/review-run-workflow.controller';
import { PullRequestReviewStepRepository } from './repository/pull-request-review-step.repository';
@Module({
  imports: [
    forwardRef(() => AiModule),
    LlmModule,
    TypeOrmModule.forFeature([
      PullRequest,
      PullRequestReviewJob,
      PullRequestReviewJobResult,
      PullRequestReviewStep,
      PullRequestFile,
      PullRequestFileSnapshot,
    ]),
    forwardRef(() => GithubIntegrationModule),
    HttpModule,
    CacheModule,
    BullModule.registerQueue({
      name: 'code-review',
    }),
    BullModule.registerQueue({
      name: 'pull-request-review-results',
    }),
  ],
  providers: [
    PrWorkflowService,
    GithubPrApiService,
    PullRequestSyncService,
    PullRequestFileSyncService,
    PullRequestLockService,
    PrValidationService,
    PrFileFilterService,
    GithubPrFileContentService,
    RepositoryFileContentSyncService,
    SnapshotCleanupService,
    SnapshotCleanupCron,
    PullRequestQueryService,
    PullRequestFileQueryService,
    PrContextBuilderService,
    PrCodeParsingService,
    AiReviewService,
    PullRequestAnalyzerProcessor,
    PrToolsUtilityService,
    PrReviewResultService,
    PullRequestReviewService,
    ReviewCancellationService,
    GithubPrReviewCommentService,
    PullRequestReviewResultsProcessor,
    ReviewWorkflowService,
    ReviewWorkflowEventService,
    ReviewWorkflowQueryService,
    PullRequestReviewStepRepository,
  ],
  controllers: [
    PullRequestQueryController,
    CodeParserController,
    ReviewRunWorkflowController,
  ],
  exports: [PrWorkflowService, AiReviewService, PrToolsUtilityService],
})
export class PullRequestModule {}
