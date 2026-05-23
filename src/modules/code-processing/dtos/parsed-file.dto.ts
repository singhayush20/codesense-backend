import Parser from 'web-tree-sitter';

export interface ParsedFileDto {
  filePath: string;
  language: string;
  source: string;
  tree: Parser.Tree;
  rootNode: Parser.Node;
  hasErrors: boolean;
}
