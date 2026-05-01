import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CacheModule } from '../../cache/cache.module';
import { QueueModule } from '../../queue/queue.module';
import { UserModule } from '../user/user.module';
import { GithubWebhookController } from './controller/github-webhook/github-webhook.controller';
import { GithubController } from './controller/github.controller';
import { GithubAccount } from './entity/github-account.entity';
import { GithubRepository } from './entity/github-repo.entity';
import { UserRepositorySelection } from './entity/user-repo-selection.entity';
import { PrProcessor } from './processor/pr.processor';
import { GithubAppAuthService } from './service/github-app-auth.service';
import { GithubInstallationTokenService } from './service/github-installation-token.service';
import { GithubInstallationService } from './service/github-installation.service';
import { GithubRepoService } from './service/github-repo.service';
import { GithubSelectionService } from './service/github-selection.service';
import { PrProcessingService } from './service/pr-processing/pr-processing.service';
import { GithubWebhookService } from './service/webhook/webhook.service';

@Module({
  imports: [
    HttpModule,
    CacheModule,
    UserModule,
    TypeOrmModule.forFeature([
      GithubAccount,
      GithubRepository,
      UserRepositorySelection,
    ]),
    BullModule.registerQueue({
      name: 'pr-processing',
    }),
  ],
  controllers: [GithubController, GithubWebhookController],
  providers: [
    GithubAppAuthService,
    GithubInstallationService,
    GithubInstallationTokenService,
    GithubRepoService,
    GithubSelectionService,
    PrProcessingService,
    GithubWebhookService,
    PrProcessor,
  ],
})
export class GithubIntegrationModule {}
