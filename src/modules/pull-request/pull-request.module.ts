import { forwardRef, Module } from '@nestjs/common';
import { PullRequestReview } from './entity/pull-request-review.entity';
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
import { DiffParserService } from './service/diff-parser/diff-parser.service';
import { PrAstProcessingService } from './service/pr-ast-processing/pr-ast-processing.service';
import { PrDiffMapperService } from './service/pr-diff-mapper/pr-diff-mapper.service';
import { CodeProcessingModule } from '../code-processing/code-processing.module';
import { RepositoryIndexingService } from './service/repository-indexer/repository-indexer.service';
import { PrContextBuilderService } from './service/context-builder/context-builder.service';
import { PrCodeParsingService } from './service/orchestration/pr-code-parsing/pr-code-parsing.service';
import { CodeParserController } from './controller/code-parser/code-parser.controller';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PullRequest,
      PullRequestReview,
      PullRequestFile,
      PullRequestFileSnapshot,
    ]),
    forwardRef(() => GithubIntegrationModule),
    HttpModule,
    CacheModule,
    BullModule.registerQueue({
      name: 'code-review',
    }),
    CodeProcessingModule,
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
    DiffParserService,
    PrAstProcessingService,
    PrDiffMapperService,
    RepositoryIndexingService,
    PrContextBuilderService,
    PrCodeParsingService,
  ],
  controllers: [PullRequestQueryController, CodeParserController],
  exports: [PrWorkflowService],
})
export class PullRequestModule {}
