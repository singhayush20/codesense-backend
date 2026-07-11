import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { AppException } from '../../../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../../../exception-handling/exception-codes';
import { REVIEW_WORKFLOW } from '../../../definition/review-workflow.definition';
import { PullRequestReviewStep } from '../../../entity/pull-request-review-step.entity';
import { PullRequestReviewJob } from '../../../entity/pull-request-review-job.entity';
import { PullRequest } from '../../../entity/pull-request.entity';
import { PullRequestReviewStatus } from '../../../enums/pull-request-review-status.enum';
import { ReviewWorkflowStepStatus } from '../../../enums/review-workflow-step-status.enum';
import { ReviewWorkflowStep } from '../../../enums/review-workflow-step.enum';
import { ReviewWorkflowEventService } from './review-workflow-event.service';
import {
  StartRunInput,
  WorkflowStepEvent,
} from '../../../dto/review/review-workflow-input.dto';

// TODO: checkout redis pub-sub for event service to support multiple instances of the service
@Injectable()
export class ReviewWorkflowService {
  private readonly logger = new Logger(ReviewWorkflowService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly eventService: ReviewWorkflowEventService,
  ) {}

  async startRun(input: StartRunInput): Promise<{
    reviewJob: PullRequestReviewJob;
    supersededRunIds: string[];
  }> {
    const supersededRunIds: string[] = [];

    const reviewJob = await this.dataSource.transaction(async (manager) => {
      const pullRequest = await manager.findOne(PullRequest, {
        where: {
          id: input.pullRequestId,
        },
      });

      if (!pullRequest) {
        throw new AppException(
          ExceptionCodes.PULL_REQUEST_NOT_FOUND,
          `Pull request not found: ${input.pullRequestId}`,
          HttpStatus.NOT_FOUND,
        );
      }

      const existingInProgressJobs = await manager
        .createQueryBuilder(PullRequestReviewJob, 'review')
        .innerJoin('review.pullRequest', 'pullRequest')
        .where('pullRequest.id = :pullRequestId', {
          pullRequestId: input.pullRequestId,
        })
        .andWhere('review.status = :status', {
          status: PullRequestReviewStatus.IN_PROGRESS,
        })
        .getMany();

      for (const existingJob of existingInProgressJobs) {
        existingJob.status = PullRequestReviewStatus.SUPERSEDED;
        await manager.save(PullRequestReviewJob, existingJob);
        await this.finalizeOpenSteps(
          manager,
          existingJob.runId,
          ReviewWorkflowStepStatus.CANCELLED,
          'Review run superseded by a newer run.',
        );
        supersededRunIds.push(existingJob.runId);
      }

      const job = manager.create(PullRequestReviewJob, {
        runId: input.runId,
        pullRequest,
        providerType: input.provider,
        status: PullRequestReviewStatus.IN_PROGRESS,
        headSha: input.headSha,
        baseSha: input.baseSha,
      });

      const savedJob = await manager.save(PullRequestReviewJob, job);
      const steps = REVIEW_WORKFLOW.map((step) =>
        manager.create(PullRequestReviewStep, {
          job: savedJob,
          step,
          status: ReviewWorkflowStepStatus.PENDING,
        }),
      );

      await manager.save(PullRequestReviewStep, steps);

      return savedJob;
    });

    for (const supersededRunId of supersededRunIds) {
      this.eventService.publishRunSuperseded(supersededRunId);
    }

    this.logger.log(
      `Started review workflow. runId=${input.runId}, pullRequestId=${input.pullRequestId}`,
    );

    return {
      reviewJob,
      supersededRunIds,
    };
  }

  async startStep(
    runId: string,
    step: ReviewWorkflowStep,
  ): Promise<PullRequestReviewStep> {
    const workflowStep = await this.dataSource.transaction((manager) =>
      this.transitionStepToRunning(manager, runId, step),
    );

    this.eventService.publishStepStarted(this.toStepEvent(runId, workflowStep));

    return workflowStep;
  }

  async completeStep(
    runId: string,
    step: ReviewWorkflowStep,
  ): Promise<PullRequestReviewStep> {
    const workflowStep = await this.dataSource.transaction(async (manager) => {
      const currentStep = await this.findStep(manager, runId, step);

      if (
        currentStep.status !== ReviewWorkflowStepStatus.RUNNING ||
        !currentStep.startedAt
      ) {
        throw this.invalidTransition(
          `Cannot complete workflow step before it has started. runId=${runId}, step=${step}`,
        );
      }

      const completedAt = new Date();
      currentStep.status = ReviewWorkflowStepStatus.SUCCESS;
      currentStep.completedAt = completedAt;
      currentStep.durationMs =
        completedAt.getTime() - currentStep.startedAt.getTime();
      currentStep.errorMessage = null;

      return manager.save(PullRequestReviewStep, currentStep);
    });

    this.eventService.publishStepCompleted(
      this.toStepEvent(runId, workflowStep),
    );

    return workflowStep;
  }

  async failStep(
    runId: string,
    step: ReviewWorkflowStep,
    error: unknown,
  ): Promise<PullRequestReviewStep> {
    const workflowStep = await this.dataSource.transaction((manager) =>
      this.finalizeStep(
        manager,
        runId,
        step,
        ReviewWorkflowStepStatus.FAILED,
        this.getErrorMessage(error),
      ),
    );

    this.eventService.publishStepFailed(this.toStepEvent(runId, workflowStep));

    return workflowStep;
  }

  async cancelStep(
    runId: string,
    step: ReviewWorkflowStep,
    reason?: string,
  ): Promise<PullRequestReviewStep> {
    const workflowStep = await this.dataSource.transaction((manager) =>
      this.finalizeStep(
        manager,
        runId,
        step,
        ReviewWorkflowStepStatus.CANCELLED,
        reason,
      ),
    );

    this.eventService.publishStepCompleted(
      this.toStepEvent(runId, workflowStep),
    );

    return workflowStep;
  }

  async completeRun(runId: string): Promise<PullRequestReviewJob> {
    const { reviewJob, completedStep } = await this.dataSource.transaction(
      async (manager) => {
        const reviewJob = await this.findJob(manager, runId);
        reviewJob.status = PullRequestReviewStatus.SUCCESS;

        const completedStep = await this.ensureCompletedStep(manager, runId);
        const savedJob = await manager.save(PullRequestReviewJob, reviewJob);

        return {
          reviewJob: savedJob,
          completedStep,
        };
      },
    );

    if (completedStep) {
      this.eventService.publishStepCompleted(
        this.toStepEvent(runId, completedStep),
      );
    }

    this.eventService.publishRunCompleted(runId);

    return reviewJob;
  }

  async failRun(runId: string, error: unknown): Promise<PullRequestReviewJob> {
    const reviewJob = await this.dataSource.transaction(async (manager) => {
      const reviewJob = await this.findJob(manager, runId);
      reviewJob.status = PullRequestReviewStatus.FAILED;
      await this.finalizeOpenSteps(
        manager,
        runId,
        ReviewWorkflowStepStatus.SKIPPED,
        this.getErrorMessage(error),
      );

      return manager.save(PullRequestReviewJob, reviewJob);
    });

    this.eventService.publishRunFailed(runId);

    return reviewJob;
  }

  async cancelRun(
    runId: string,
    reason?: string,
  ): Promise<PullRequestReviewJob> {
    const reviewJob = await this.dataSource.transaction(async (manager) => {
      const reviewJob = await this.findJob(manager, runId);
      reviewJob.status = PullRequestReviewStatus.CANCELLED;
      await this.finalizeOpenSteps(
        manager,
        runId,
        ReviewWorkflowStepStatus.CANCELLED,
        reason,
      );

      return manager.save(PullRequestReviewJob, reviewJob);
    });

    this.eventService.publishRunCancelled(runId);

    return reviewJob;
  }

  async supersedeRun(
    runId: string,
    reason?: string,
  ): Promise<PullRequestReviewJob> {
    const reviewJob = await this.dataSource.transaction(async (manager) => {
      const reviewJob = await this.findJob(manager, runId);
      reviewJob.status = PullRequestReviewStatus.SUPERSEDED;
      await this.finalizeOpenSteps(
        manager,
        runId,
        ReviewWorkflowStepStatus.CANCELLED,
        reason ?? 'Review run superseded by a newer run.',
      );

      return manager.save(PullRequestReviewJob, reviewJob);
    });

    this.eventService.publishRunSuperseded(runId);

    return reviewJob;
  }

  private async transitionStepToRunning(
    manager: EntityManager,
    runId: string,
    step: ReviewWorkflowStep,
  ): Promise<PullRequestReviewStep> {
    const currentStep = await this.findStep(manager, runId, step);

    if (currentStep.status !== ReviewWorkflowStepStatus.PENDING) {
      throw this.invalidTransition(
        `Cannot start workflow step from status ${currentStep.status}. runId=${runId}, step=${step}`,
      );
    }

    currentStep.status = ReviewWorkflowStepStatus.RUNNING;
    currentStep.startedAt = new Date();
    currentStep.completedAt = null;
    currentStep.durationMs = null;
    currentStep.errorMessage = null;

    return manager.save(PullRequestReviewStep, currentStep);
  }

  private async finalizeStep(
    manager: EntityManager,
    runId: string,
    step: ReviewWorkflowStep,
    status:
      | ReviewWorkflowStepStatus.FAILED
      | ReviewWorkflowStepStatus.CANCELLED,
    errorMessage?: string | null,
  ): Promise<PullRequestReviewStep> {
    const currentStep = await this.findStep(manager, runId, step);
    const completedAt = new Date();

    currentStep.startedAt = currentStep.startedAt ?? completedAt;
    currentStep.completedAt = completedAt;
    currentStep.durationMs =
      completedAt.getTime() - currentStep.startedAt.getTime();
    currentStep.status = status;
    currentStep.errorMessage = errorMessage;

    return manager.save(PullRequestReviewStep, currentStep);
  }

  private async ensureCompletedStep(
    manager: EntityManager,
    runId: string,
  ): Promise<PullRequestReviewStep | null> {
    const completedStep = await this.findStep(
      manager,
      runId,
      ReviewWorkflowStep.COMPLETED,
    );

    if (completedStep.status === ReviewWorkflowStepStatus.SUCCESS) {
      return null;
    }

    const now = new Date();
    completedStep.status = ReviewWorkflowStepStatus.SUCCESS;
    completedStep.startedAt = completedStep.startedAt ?? now;
    completedStep.completedAt = now;
    completedStep.durationMs =
      now.getTime() - completedStep.startedAt.getTime();
    completedStep.errorMessage = null;

    return manager.save(PullRequestReviewStep, completedStep);
  }

  private async finalizeOpenSteps(
    manager: EntityManager,
    runId: string,
    status:
      | ReviewWorkflowStepStatus.CANCELLED
      | ReviewWorkflowStepStatus.SKIPPED,
    errorMessage?: string | null,
  ): Promise<void> {
    const steps = await manager.find(PullRequestReviewStep, {
      where: {
        job: {
          runId,
        },
      },
      relations: ['job'],
    });

    const now = new Date();
    const updatedSteps = steps
      .filter(
        (step) =>
          step.status === ReviewWorkflowStepStatus.RUNNING ||
          step.status === ReviewWorkflowStepStatus.PENDING,
      )
      .map((step) => {
        if (step.status === ReviewWorkflowStepStatus.RUNNING) {
          step.completedAt = now;
          step.durationMs = step.startedAt
            ? now.getTime() - step.startedAt.getTime()
            : 0;
          step.status = status;
        } else {
          step.status = ReviewWorkflowStepStatus.SKIPPED;
        }

        step.errorMessage = errorMessage;
        return step;
      });

    if (updatedSteps.length > 0) {
      await manager.save(PullRequestReviewStep, updatedSteps);
    }
  }

  private async findJob(
    manager: EntityManager,
    runId: string,
  ): Promise<PullRequestReviewJob> {
    const reviewJob = await manager.findOne(PullRequestReviewJob, {
      where: {
        runId,
      },
    });

    if (!reviewJob) {
      throw new AppException(
        ExceptionCodes.REVIEW_RUN_NOT_FOUND,
        `Review run not found: ${runId}`,
        HttpStatus.NOT_FOUND,
      );
    }

    return reviewJob;
  }

  private async findStep(
    manager: EntityManager,
    runId: string,
    step: ReviewWorkflowStep,
  ): Promise<PullRequestReviewStep> {
    const workflowStep = await manager.findOne(PullRequestReviewStep, {
      where: {
        job: {
          runId,
        },
        step,
      },
      relations: ['job'],
    });

    if (!workflowStep) {
      throw new AppException(
        ExceptionCodes.REVIEW_RUN_NOT_FOUND,
        `Workflow step not found. runId=${runId}, step=${step}`,
        HttpStatus.NOT_FOUND,
      );
    }

    return workflowStep;
  }

  private toStepEvent(
    runId: string,
    step: PullRequestReviewStep,
  ): WorkflowStepEvent {
    return {
      runId,
      step: step.step,
      status: step.status,
      durationMs: step.durationMs,
      errorMessage: step.errorMessage,
    };
  }

  private invalidTransition(message: string): AppException {
    return new AppException(
      ExceptionCodes.INVALID_WORKFLOW_TRANSITION,
      message,
      HttpStatus.CONFLICT,
    );
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
