import {
  Injectable,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GithubWebhookUtil } from '../../utils/github-webhook.utils';
import { AxiosError } from 'axios';
import { GithubPullRequestPayload } from '../../dtos/pr-handling/github-pr.dto';
import { AppException } from '../../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../../exception-handling/exception-codes';
import { CacheService } from '../../../../cache/cache.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { In, Repository, DataSource } from 'typeorm';
import { GithubInstallation } from '../../entity/github-installation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { GithubRepository } from '../../entity/github-repo.entity';
import { UserRepositorySelection } from '../../entity/user-repo-selection.entity';

@Injectable()
export class GithubWebhookService {
  private readonly logger = new Logger(GithubWebhookService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly cacheService: CacheService,
    @InjectQueue('pr-processing')
    private readonly prQueue: Queue,
    @InjectRepository(GithubInstallation)
    private readonly installationRepo: Repository<GithubInstallation>,
    @InjectRepository(GithubRepository)
    private readonly githubRepositoryRepo: Repository<GithubRepository>,
    @InjectRepository(UserRepositorySelection)
    private readonly userRepositorySelectionRepo: Repository<UserRepositorySelection>,
  ) {}

  async handleEvent(
    event: string,
    signature: string,
    deliveryId: string,
    rawPayload: Buffer,
  ): Promise<void> {
    this.logger.log(`Webhook received: ${event} - ${deliveryId}`);

    const key = `gh:webhook:${deliveryId}`;
    const exists = await this.cacheService.exists(key);

    if (exists) {
      this.logger.warn(`Duplicate webhook skipped: ${deliveryId}`);
      return;
    }

    await this.cacheService.set(key, true, 3600);

    const secret = this.config.get<string>('github.webhookSecret');

    if (!secret) {
      this.logger.error('Webhook secret not configured');
      throw new AppException(
        ExceptionCodes.WEBHOOK_CONFIG_ERROR,
        'Webhook configuration error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const isValid = GithubWebhookUtil.verifySignature(
        rawPayload,
        signature,
        secret,
      );

      if (!isValid) {
        this.logger.warn(`Invalid signature for delivery ${deliveryId}`);
        throw new AppException(
          ExceptionCodes.INVALID_WEBHOOK_SIGNATURE,
          'Invalid webhook signature',
          HttpStatus.BAD_REQUEST,
        );
      }

      const payload: unknown = JSON.parse(rawPayload.toString('utf8'));
      this.logger.log(
        `Webhook received | event=${event} | deliveryId=${deliveryId}`,
      );

      await this.routeEvent(event, payload);
    } catch (error) {
      this.handleError(error, event, deliveryId);
    }
  }

  private async routeEvent(event: string, payload: unknown): Promise<void> {
    switch (event) {
      case 'pull_request':
        await this.handlePullRequest(payload as GithubPullRequestPayload);
        break;
      case 'installation':
        if ((payload as any).action === 'deleted') {
          await this.handleInstallationDeleted(payload);
        }
        break;
      default:
        this.logger.debug(`Unhandled event: ${event}`);
    }
  }

  private async handlePullRequest(
    payload: GithubPullRequestPayload,
  ): Promise<void> {
    const { action, installation } = payload;

    // if installation is active, then only process PR events. Otherwise ignore (e.g. if installation was deleted/deactivated but webhook still sends events)
    const dbInstallation = await this.installationRepo.findOne({
      where: { installationId: installation.id.toString() },
    });

    if (!dbInstallation || !dbInstallation.isActive) {
      this.logger.warn(
        `PR event for inactive/non-existent installation ignored: ${installation.id}`,
      );
      return;
    }

    if (!['opened', 'synchronize'].includes(action)) {
      this.logger.debug(`Ignoring PR action: ${action}`);
      return;
    }

    this.logger.log(
      `Enqueuing PR job for delivery ${payload.pull_request.number}`,
    );

    await this.prQueue.add(
      'process-pr',
      { payload },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  async handleInstallationDeleted(payload: any): Promise<void> {
    const installationId = payload.installation?.id?.toString();

    if (!installationId) {
      this.logger.warn('Invalid installation.deleted payload');
      return;
    }

    await this.dataSource.transaction(async (manager) => {
      const installation = await manager.findOne(GithubInstallation, {
        where: { installationId },
      });

      if (!installation) {
        this.logger.warn(
          `Installation not found for deletion: ${installationId}`,
        );
        return;
      }

      // 1. fetch repo ids using FK
      const repos = await manager.find(GithubRepository, {
        where: { installation: { id: installation.id } },
        select: ['id'],
      });

      const repoIds = repos.map((r) => r.id);

      if (repoIds.length > 0) {
        // 2. delete selections using FK
        await manager.delete(UserRepositorySelection, {
          repository: { id: In(repoIds) },
        });

        // 3. delete repos using FK
        await manager.delete(GithubRepository, {
          installation: { id: installation.id },
        });
      }

      // 4. delete installation
      await manager.delete(GithubInstallation, {
        id: installation.id,
      });
    });

    this.logger.log(`Installation deleted & cleaned: ${installationId}`);
  }

  private handleError(
    error: unknown,
    event: string,
    deliveryId: string,
  ): never {
    if (error instanceof AxiosError) {
      this.logger.error(
        `GitHub API error | event=${event} | deliveryId=${deliveryId} | status=${error.response?.status} | data=${JSON.stringify(error.response?.data)}`,
      );
      throw new AppException(
        ExceptionCodes.GITHUB_API_ERROR,
        'GitHub API error',
        error.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }

    this.logger.error(
      `Webhook processing failed | event=${event} | deliveryId=${deliveryId}`,
      error instanceof Error ? error.stack : undefined,
    );

    throw new AppException(
      ExceptionCodes.WEBHOOK_PROCESSING_FAILED,
      'Webhook processing failed',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
