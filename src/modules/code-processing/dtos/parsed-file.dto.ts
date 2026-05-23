import Parser from 'web-tree-sitter';

export interface ParsedFileDto {
  filePath: string;
  language?: string | null;
  source: string;
  tree?: Parser.Tree | null;
  rootNode?: Parser.Node | null;
  hasErrors?: boolean | null;
}
