export interface DiffLineDto {
  lineNumber: number;

  content: string;
}

export interface DiffHunkDto {
  oldStartLine: number;

  oldLineCount: number;

  newStartLine: number;

  newLineCount: number;

  addedLines: DiffLineDto[];

  deletedLines: DiffLineDto[];
}
