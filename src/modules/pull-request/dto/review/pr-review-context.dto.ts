export interface FileContextDto {
  fileId: string;

  filePath: string;

  reviewContext: string;
}

export interface PullRequestMetadataDto {
  title: string;

  body: string;

  baseBranch: string;

  headBranch: string;
}

export interface PullRequestReviewContextDto {
  pullRequestId: string;

  prMetadata: PullRequestMetadataDto;

  files: FileContextDto[];
}

export interface DiffHunkLine {
  type: 'addition' | 'deletion' | 'context';
  newLineNumber?: number;
  oldLineNumber?: number;
  content: string;
}

export interface StructuredHunk {
  header: string;
  lines: DiffHunkLine[];
}
