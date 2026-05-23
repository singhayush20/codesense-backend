import { Injectable } from '@nestjs/common';
import { ParsedPrFileDto } from '../../../pull-request/dto/parsing/parsed-pr-file-data.dto';
import { SymbolDefinitionDto } from '../../dtos/symbol-definition.dto';
import { AstNodeUtil } from '../../utils/ast-node.util';
import Parser from 'web-tree-sitter';

@Injectable()
export class SymbolDefinitionService {
  findDefinition(
    symbolName: string,
    parsedFiles: ParsedPrFileDto[],
  ): SymbolDefinitionDto | null {
    for (const file of parsedFiles) {
      const definition = this.searchNode(file, file.rootNode, symbolName);

      if (definition) {
        return definition;
      }
    }

    return null;
  }

  private searchNode(
    file: ParsedPrFileDto,
    node: Parser.Node,
    symbolName: string,
  ): SymbolDefinitionDto | null {
    const nameNode = node.childForFieldName('name');

    if (nameNode?.text === symbolName) {
      return {
        filePath: file.filePath,
        symbolName,
        nodeType: node.type,
        startLine: node.startPosition.row + 1,
        endLine: node.endPosition.row + 1,
        content: AstNodeUtil.getNodeText(file.source, node),
      };
    }

    for (const child of node.children) {
      if (child) {
        const result = this.searchNode(file, child, symbolName);

        if (result) {
          return result;
        }
      }
    }

    return null;
  }
}
