export interface RepositorySymbolDto {
  name: string;

  type: string;

  language: string;

  filePath: string;

  startLine: number;

  endLine: number;

  signature?: string;
}
