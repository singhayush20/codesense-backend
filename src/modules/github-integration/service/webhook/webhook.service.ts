import { InjectQueue } from '@nestjs/bullmq';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { Queue } from 'bullmq';

import { CacheService } from '../../../../cache/cache.service';
import { AppException } from '../../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../../exception-handling/exception-codes';
import {
  GithubEventType,
  GithubPullRequestPayload,
} from '../../dtos/pr-handling/github-pr.dto';
import { GithubWebhookUtil } from '../../utils/github-webhook.utils';

@Injectable()
export class GithubWebhookService {
  private readonly logger = new Logger(GithubWebhookService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly cacheService: CacheService,
    @InjectQueue('pr-processing')
    private readonly prQueue: Queue,
  ) {}

  async handleEvent(
    event: GithubEventType,
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

  private async routeEvent(
    event: GithubEventType,
    payload: unknown,
  ): Promise<void> {
    switch (event) {
      case 'pull_request':
        await this.handlePullRequest(payload as GithubPullRequestPayload);
        break;

      default:
        this.logger.debug(`Unhandled event: ${event}`);
    }
  }

  private async handlePullRequest(
    payload: GithubPullRequestPayload,
  ): Promise<void> {
    const { action } = payload;

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
