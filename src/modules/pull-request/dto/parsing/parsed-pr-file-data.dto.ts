import Parser from 'web-tree-sitter';

export interface ParsedPrFileDto {
  fileId: string;

  filePath: string;

  language?: string | null;

  source: string;

  patch?: string;

  tree?: Parser.Tree | null;

  rootNode?: Parser.Node | null;
}
