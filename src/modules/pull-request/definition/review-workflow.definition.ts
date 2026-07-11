import { ReviewWorkflowStep } from '../enums/review-workflow-step.enum';

export const REVIEW_WORKFLOW: readonly ReviewWorkflowStep[] = [
  ReviewWorkflowStep.INITIALIZING,
  ReviewWorkflowStep.FETCHING_PULL_REQUEST,
  ReviewWorkflowStep.BUILDING_REVIEW_CONTEXT,
  ReviewWorkflowStep.GENERATING_REVIEW,
  ReviewWorkflowStep.SAVING_RESULTS,
  ReviewWorkflowStep.COMPLETED,
];
