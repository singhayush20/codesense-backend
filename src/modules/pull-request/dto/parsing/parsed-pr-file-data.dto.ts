import Parser from 'web-tree-sitter';

export interface ParsedPrFileDto {
  fileId: string;

  filePath: string;

  language: string;

  source: string;

  patch?: string;

  tree: Parser.Tree;

  rootNode: Parser.Node;
}
