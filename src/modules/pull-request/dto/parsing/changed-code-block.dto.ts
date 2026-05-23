export interface ChangedCodeBlockDto {
  filePath: string;

  language: string;

  nodeType: string;

  startLine: number;

  endLine: number;

  changedLines: number[];

  diffSnippet: string;

  enclosingCodeBlock: string;
}
