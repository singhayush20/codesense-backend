import { ReviewWorkflowEventType } from '../../enums/review-workflow-event-type.enum';
import { ReviewWorkflowStep } from '../../enums/review-workflow-step.enum';
import { ReviewWorkflowStepStatus } from '../../enums/review-workflow-step-status.enum';

export interface ReviewWorkflowEventDto {
  type: ReviewWorkflowEventType;
  runId: string;
  step?: ReviewWorkflowStep;
  status?: ReviewWorkflowStepStatus;
  durationMs?: number | null;
  errorMessage?: string | null;
  timestamp: string;
}
