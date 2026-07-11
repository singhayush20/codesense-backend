export enum ReviewWorkflowStep {
  INITIALIZING = 'initializing',
  FETCHING_PULL_REQUEST = 'fetching_pull_request',
  BUILDING_REVIEW_CONTEXT = 'building_review_context',
  GENERATING_REVIEW = 'generating_review',
  SAVING_RESULTS = 'saving_results',
  COMPLETED = 'completed',
}
