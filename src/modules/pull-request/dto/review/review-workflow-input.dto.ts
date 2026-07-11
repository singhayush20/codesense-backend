import { ProviderType } from '../../../ai/enums/provider.type';
import { ReviewWorkflowStep } from '../../enums/review-workflow-step.enum';
import { ReviewWorkflowStepStatus } from '../../enums/review-workflow-step-status.enum';

export interface StartRunInput {
  pullRequestId: string;
  provider: ProviderType;
  runId: string;
  headSha: string;
  baseSha: string;
}

export interface WorkflowStepEvent {
  runId: string;
  step: ReviewWorkflowStep;
  status: ReviewWorkflowStepStatus;
  durationMs?: number | null;
  errorMessage?: string | null;
}
