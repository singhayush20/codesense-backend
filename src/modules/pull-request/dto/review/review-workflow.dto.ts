import { ProviderType } from '../../../ai/enums/provider.type';
import { PullRequestReviewStatus } from '../../enums/pull-request-review-status.enum';
import { ReviewWorkflowStep } from '../../enums/review-workflow-step.enum';
import { ReviewWorkflowStepStatus } from '../../enums/review-workflow-step-status.enum';

export interface ReviewWorkflowStepDto {
  step: ReviewWorkflowStep;
  status: ReviewWorkflowStepStatus;
  startedAt?: Date | null;
  completedAt?: Date | null;
  durationMs?: number | null;
  errorMessage?: string | null;
}

export interface ReviewRunWorkflowDto {
  run: {
    runId: string;
    status: PullRequestReviewStatus;
    provider: ProviderType;
    pullRequestId: string;
    headSha?: string;
    baseSha?: string;
    createdAt: Date;
  };
  steps: ReviewWorkflowStepDto[];
}
