import { HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ReviewWorkflowEventService } from './review-workflow-event.service';
import { ReviewWorkflowService } from './review-workflow.service';
import { ReviewWorkflowStep } from '../../../enums/review-workflow-step.enum';
import { ReviewWorkflowStepStatus } from '../../../enums/review-workflow-step-status.enum';
import { PullRequestReviewStatus } from '../../../enums/pull-request-review-status.enum';
import { ProviderType } from '../../../../ai/enums/provider.type';
import { AppException } from '../../../../../exception-handling/app-exception.exception';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
describe('ReviewWorkflowService', () => {
  const manager = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((_, value) => value),
    createQueryBuilder: jest.fn(),
  };

  const dataSource = {
    transaction: jest.fn((callback) => callback(manager)),
  } as unknown as DataSource;

  const eventService = {
    publishStepStarted: jest.fn(),
    publishStepCompleted: jest.fn(),
    publishStepFailed: jest.fn(),
    publishRunCompleted: jest.fn(),
    publishRunFailed: jest.fn(),
    publishRunCancelled: jest.fn(),
    publishRunSuperseded: jest.fn(),
  } as unknown as ReviewWorkflowEventService;

  let service: ReviewWorkflowService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReviewWorkflowService(dataSource, eventService);
  });

  it('creates a review run with every workflow step pending', async () => {
    const pullRequest = { id: 'pr-1' };
    const savedJob = {
      id: 7,
      runId: 'run-1',
      pullRequest,
      providerType: ProviderType.GEMINI,
      status: PullRequestReviewStatus.IN_PROGRESS,
    };

    manager.findOne.mockResolvedValueOnce(pullRequest);
    manager.createQueryBuilder.mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });
    manager.save
      .mockResolvedValueOnce(savedJob)
      .mockImplementationOnce((_, steps) => Promise.resolve(steps));

    const result = await service.startRun({
      pullRequestId: 'pr-1',
      provider: ProviderType.GEMINI,
      runId: 'run-1',
      headSha: 'head',
      baseSha: 'base',
    });

    expect(result.reviewJob).toBe(savedJob);
    expect(result.supersededRunIds).toEqual([]);
    expect(manager.save).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      expect.arrayContaining([
        expect.objectContaining({
          job: savedJob,
          step: ReviewWorkflowStep.INITIALIZING,
          status: ReviewWorkflowStepStatus.PENDING,
        }),
        expect.objectContaining({
          job: savedJob,
          step: ReviewWorkflowStep.COMPLETED,
          status: ReviewWorkflowStepStatus.PENDING,
        }),
      ]),
    );
  });

  it('rejects completing a step before it has started', async () => {
    manager.findOne.mockResolvedValueOnce({
      job: { runId: 'run-1' },
      step: ReviewWorkflowStep.GENERATING_REVIEW,
      status: ReviewWorkflowStepStatus.PENDING,
    });

    await expect(
      service.completeStep('run-1', ReviewWorkflowStep.GENERATING_REVIEW),
    ).rejects.toMatchObject<AppException>({
      code: expect.any(String),
      status: HttpStatus.CONFLICT,
    });
  });

  it('stores completed step duration in milliseconds', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-05T10:00:03.250Z'));
    const startedAt = new Date('2026-07-05T10:00:00.000Z');
    const step = {
      job: { runId: 'run-1' },
      step: ReviewWorkflowStep.GENERATING_REVIEW,
      status: ReviewWorkflowStepStatus.RUNNING,
      startedAt,
    };

    manager.findOne.mockResolvedValueOnce(step);
    manager.save.mockImplementationOnce((_, value) => Promise.resolve(value));

    const result = await service.completeStep(
      'run-1',
      ReviewWorkflowStep.GENERATING_REVIEW,
    );

    expect(result.durationMs).toBe(3250);
    expect(result.completedAt).toEqual(new Date('2026-07-05T10:00:03.250Z'));
    expect(eventService.publishStepCompleted as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        runId: 'run-1',
        step: ReviewWorkflowStep.GENERATING_REVIEW,
        durationMs: 3250,
      }),
    );

    jest.useRealTimers();
  });
});
