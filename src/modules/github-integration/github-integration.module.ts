import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../../cache/cache.module';
import { UserModule } from '../user/user.module';
import { GithubController } from './controller/github.controller';
import { GithubAccount } from './entity/github-account.entity';
import { GithubRepository } from './entity/github-repo.entity';
import { UserRepositorySelection } from './entity/user-repo-selection.entity';
import { GithubAppAuthService } from './service/github-app-auth.service';
import { GithubInstallationService } from './service/github-installation.service';
import { GithubInstallationTokenService } from './service/github-installation-token.service';
import { GithubRepoService } from './service/github-repo.service';
import { GithubSelectionService } from './service/github-selection.service';
import { GithubWebhookService } from './service/webhook/webhook.service';
import { GithubWebhookController } from './controller/github-webhook/github-webhook.controller';
import { PrProcessor } from './processor/pr.processor';
import { BullModule } from '@nestjs/bullmq';
import { GithubApiService } from './service/github-api.service';
import { GithubInstallation } from './entity/github-installation.entity';
import { User } from '../user/entity/user.entity';
import { WebhookEvent } from './entity/github-webhook-event.entity';
import { PullRequestModule } from '../pull-request/pull-request.module';

@Module({
  imports: [
    HttpModule,
    CacheModule,
    UserModule,
    TypeOrmModule.forFeature([
      GithubAccount,
      GithubRepository,
      UserRepositorySelection,
      GithubInstallation,
      User,
      WebhookEvent,
    ]),
    BullModule.registerQueue({
      name: 'pr-processing',
    }),
    forwardRef(() => PullRequestModule),
  ],
  controllers: [GithubController, GithubWebhookController],
  providers: [
    GithubAppAuthService,
    GithubInstallationService,
    GithubInstallationTokenService,
    GithubRepoService,
    GithubSelectionService,
    GithubWebhookService,
    PrProcessor,
    GithubApiService,
  ],
  exports: [
    GithubRepoService,
    GithubInstallationTokenService,
    GithubSelectionService,
  ],
})
export class GithubIntegrationModule {}
