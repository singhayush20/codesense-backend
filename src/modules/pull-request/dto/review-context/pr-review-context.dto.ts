export interface PullRequestReviewContextDto {
  pullRequestId: string;

  files: Array<{
    fileId: string;

    filePath: string;

    reviewContext: string;
  }>;
}
