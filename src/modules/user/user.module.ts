import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './service/user.service';
import { UserController } from './controller/user.controller';
import { Role } from './entity/role.entity';
import { UserRole } from './entity/user-role.entity';
import { User } from './entity/user.entity';
import { UserRepository } from './repository/user.repository';
import { DashboardController } from './controller/dashboard.controller';
import { DashboardStatsService } from './service/dashboard-stats.service';
import { GithubRepository } from '../github-integration/entity/github-repo.entity';
import { UserRepositorySelection } from '../github-integration/entity/user-repo-selection.entity';
import { PullRequest } from '../pull-request/entity/pull-request.entity';
import { PullRequestReviewJob } from '../pull-request/entity/pull-request-review-job.entity';
import { PullRequestReviewJobResult } from '../pull-request/entity/pull-request-review-job-result.entity';
import { PullRequestReviewStep } from '../pull-request/entity/pull-request-review-step.entity';
import { LLMProvider } from '../llm/entity/llm-provider.entity';
import { CacheModule } from '../../cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      UserRole,
      GithubRepository,
      UserRepositorySelection,
      PullRequest,
      PullRequestReviewJob,
      PullRequestReviewJobResult,
      LLMProvider,
      PullRequestReviewStep,
    ]),
    CacheModule,
  ],
  providers: [UserService, UserRepository, DashboardStatsService],
  controllers: [UserController, DashboardController],
  exports: [UserService],
})
export class UserModule {}
