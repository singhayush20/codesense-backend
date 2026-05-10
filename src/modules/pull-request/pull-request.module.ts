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
@Module({
  imports: [
    TypeOrmModule.forFeature([PullRequest, PullRequestReview, PullRequestFile]),
    forwardRef(() => GithubIntegrationModule),
    HttpModule,
    CacheModule,
    BullModule.registerQueue({
      name: 'code-review',
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
  ],
  controllers: [],
  exports: [PrWorkflowService],
})
export class PullRequestModule {}
