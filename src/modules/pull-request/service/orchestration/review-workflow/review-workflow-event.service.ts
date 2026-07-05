import { Injectable, Logger, MessageEvent } from '@nestjs/common';
import {
  Observable,
  Subject,
  interval,
  map,
  merge,
  takeUntil,
  timer,
} from 'rxjs';
import { ReviewWorkflowEventDto } from '../../../dto/review/review-workflow-event.dto';
import { ReviewWorkflowEventType } from '../../../enums/review-workflow-event-type.enum';
import { ReviewWorkflowStep } from '../../../enums/review-workflow-step.enum';
import { ReviewWorkflowStepStatus } from '../../../enums/review-workflow-step-status.enum';

interface StepEventInput {
  runId: string;
  step: ReviewWorkflowStep;
  status: ReviewWorkflowStepStatus;
  durationMs?: number | null;
  errorMessage?: string | null;
}

@Injectable()
export class ReviewWorkflowEventService {
  private readonly logger = new Logger(ReviewWorkflowEventService.name);
  private readonly subjects = new Map<
    string,
    Subject<ReviewWorkflowEventDto>
  >();

  subscribe(runId: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const subject = this.getSubject(runId);
      const events = subject.asObservable().pipe(
        map((event) => ({
          type: event.type,
          data: event,
        })),
      );

      const heartbeat = interval(30000).pipe(
        map(() => ({
          type: 'HEARTBEAT',
          data: {
            runId,
            timestamp: new Date().toISOString(),
          },
        })),
      );

      const subscription = merge(events, heartbeat)
        .pipe(takeUntil(timer(30 * 60 * 1000)))
        .subscribe(subscriber);

      return () => {
        subscription.unsubscribe();
        if (!subject.observed) {
          this.subjects.delete(runId);
        }
      };
    });
  }

  publishStepStarted(input: StepEventInput): void {
    this.publish(ReviewWorkflowEventType.STEP_STARTED, input);
  }

  publishStepCompleted(input: StepEventInput): void {
    this.publish(ReviewWorkflowEventType.STEP_COMPLETED, input);
  }

  publishStepFailed(input: StepEventInput): void {
    this.publish(ReviewWorkflowEventType.STEP_FAILED, input);
  }

  publishRunCompleted(runId: string): void {
    this.publishRunEvent(ReviewWorkflowEventType.RUN_COMPLETED, runId);
  }

  publishRunFailed(runId: string): void {
    this.publishRunEvent(ReviewWorkflowEventType.RUN_FAILED, runId);
  }

  publishRunCancelled(runId: string): void {
    this.publishRunEvent(ReviewWorkflowEventType.RUN_CANCELLED, runId);
  }

  publishRunSuperseded(runId: string): void {
    this.publishRunEvent(ReviewWorkflowEventType.RUN_SUPERSEDED, runId);
  }

  private publish(type: ReviewWorkflowEventType, input: StepEventInput): void {
    try {
      this.getSubject(input.runId).next({
        type,
        runId: input.runId,
        step: input.step,
        status: input.status,
        durationMs: input.durationMs,
        errorMessage: input.errorMessage,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.warn(
        `Failed to publish workflow event. runId=${input.runId}, type=${type}, error=${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private publishRunEvent(type: ReviewWorkflowEventType, runId: string): void {
    try {
      this.getSubject(runId).next({
        type,
        runId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.warn(
        `Failed to publish workflow run event. runId=${runId}, type=${type}, error=${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private getSubject(runId: string): Subject<ReviewWorkflowEventDto> {
    let subject = this.subjects.get(runId);

    if (!subject || subject.closed) {
      subject = new Subject<ReviewWorkflowEventDto>();
      this.subjects.set(runId, subject);
    }

    return subject;
  }
}
