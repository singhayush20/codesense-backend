export interface FileContextDto {
  fileId: string;

  filePath: string;

  reviewContext: string;
}

export interface PullRequestReviewContextDto {
  pullRequestId: string;

  files: FileContextDto[];
}
