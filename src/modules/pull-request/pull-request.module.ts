import { forwardRef, Module } from '@nestjs/common';
import { PullRequestReview } from './entity/pull-request-review.entity';
import { PullRequest } from './entity/pull-request.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PullRequestFile } from './entity/pull-request-file.entity';
import { PrProcessingService } from './service/pr-processing-service/pr-processing.service';
import { GithubIntegrationModule } from '../github-integration/github-integration.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([PullRequest, PullRequestReview, PullRequestFile]),
    forwardRef(() => GithubIntegrationModule),
        HttpModule,
  ],
  providers: [PrProcessingService],
  controllers: [],
  exports: [PrProcessingService],
})
export class PullRequestModule {}
