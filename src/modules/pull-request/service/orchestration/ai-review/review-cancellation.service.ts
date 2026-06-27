import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { RedisService } from '../../../../../cache/redis/redis.service';

export const PULL_REQUEST_REVIEW_CANCELLATION_CHANNEL =
  'pr-review-cancellation';

/**
 * Coordinates cancellation of in-flight review runs across distributed app instances.
 *
 * Each process maintains its own runtime abort controllers, while Redis pub/sub
 * is used to broadcast cancellation events to peer instances.
 */
@Injectable()
export class ReviewCancellationService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ReviewCancellationService.name);

  /**
   * Local registry of active review run abort controllers.
   * This is process-local because AbortSignal cannot be shared across processes.
   */
  private readonly subscribers = new Map<string, AbortController>();
  private subscriberClient?: ReturnType<RedisService['getClient']>;

  constructor(private readonly redisService: RedisService) {}

  async onModuleDestroy(): Promise<void> {
    if (this.subscriberClient) {
      await this.subscriberClient.quit();
    }
  }

  /**
   * Start the Redis subscriber when the module initializes.
   * This allows the service to receive cancellation broadcasts from other instances.
   */
  async onModuleInit(): Promise<void> {
    this.subscriberClient = this.redisService.getClient().duplicate();
    this.subscriberClient.on('message', (channel, message) => {
      if (channel !== PULL_REQUEST_REVIEW_CANCELLATION_CHANNEL) {
        return;
      }

      try {
        const payload = JSON.parse(message) as { runId: string };
        const controller = this.subscribers.get(payload.runId);
        if (controller) {
          this.logger.log(`Cancelling local review run ${payload.runId}`);
          controller.abort();
          this.subscribers.delete(payload.runId);
        }
      } catch (error) {
        this.logger.error(
          `Failed to process cancellation message: ${message}`,
          error as Error,
        );
      }
    });

    await this.subscriberClient.subscribe(
      PULL_REQUEST_REVIEW_CANCELLATION_CHANNEL,
    );
  }

  publishCancellation(runId: string): Promise<number> {
    return this.redisService
      .getClient()
      .publish(
        PULL_REQUEST_REVIEW_CANCELLATION_CHANNEL,
        JSON.stringify({ runId }),
      );
  }

  /**
   * Register a local abort controller for an active review run.
   * The controller is aborted if a cancellation message arrives for this run.
   */
  register(runId: string): AbortSignal {
    const controller = new AbortController();
    this.subscribers.set(runId, controller);
    return controller.signal;
  }

  /**
   * Remove local cancellation state after the review run completes.
   */
  deregister(runId: string): void {
    const controller = this.subscribers.get(runId);
    if (controller) {
      this.subscribers.delete(runId);
    }
  }
}
