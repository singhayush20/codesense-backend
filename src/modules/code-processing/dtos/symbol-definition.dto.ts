export interface SymbolDefinitionDto {
  filePath: string;

  symbolName: string;

  nodeType: string;

  startLine: number;

  endLine: number;

  content: string;
}
