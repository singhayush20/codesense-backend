import Parser from 'web-tree-sitter';
import { RepositorySymbolDto } from '../dtos/repository-symbol.dto';

export class SymbolExtractorUtil {
  static extractSymbols(
    filePath: string,
    language: string,
    rootNode: Parser.Node,
  ): RepositorySymbolDto[] {
    // TODO: array maintained locally only for testing
    const symbols: RepositorySymbolDto[] = [];

    const visit = (node: Parser.Node): void => {
      const nameNode = node.childForFieldName('name');

      const lineSpan = node.endPosition.row - node.startPosition.row;

      /**
       * Generic structural heuristics
       */
      const isMeaningfulStructure = node.isNamed && !!nameNode && lineSpan >= 2;

      if (isMeaningfulStructure) {
        symbols.push({
          name: nameNode.text,

          type: node.type,

          language,

          filePath,

          startLine: node.startPosition.row + 1,

          endLine: node.endPosition.row + 1,
        });
      }

      for (const child of node.children) {
        if (child) {
          visit(child);
        }
      }
    };

    visit(rootNode);

    return symbols;
  }
}
