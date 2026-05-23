import { Injectable } from '@nestjs/common';

import { ChangedCodeBlockDto } from '../../dto/parsing/changed-code-block.dto';

import { ParsedPrFileDto } from '../../dto/parsing/parsed-pr-file-data.dto';

import { DiffParserService } from '../diff-parser/diff-parser.service';

import { AstNodeUtil } from '../../../code-processing/utils/ast-node.util';

@Injectable()
export class PrDiffMapperService {
  constructor(private readonly diffParserService: DiffParserService) {}

  extractChangedBlocks(parsedFile: ParsedPrFileDto): ChangedCodeBlockDto[] {
    if (!parsedFile.patch) {
      return [];
    }

    const hunks = this.diffParserService.parsePatch(parsedFile.patch);

    const blocks = new Map<string, ChangedCodeBlockDto>();

    for (const hunk of hunks) {
      for (const addedLine of hunk.addedLines) {
        const meaningfulNode = AstNodeUtil.findEnclosingNamedNodeAtLine(
          parsedFile.rootNode,
          addedLine.lineNumber,
        );

        if (!meaningfulNode) {
          continue;
        }

        const key = `${meaningfulNode.startIndex}-${meaningfulNode.endIndex}`;

        const existingBlock = blocks.get(key);

        if (existingBlock) {
          existingBlock.changedLines.push(addedLine.lineNumber);

          existingBlock.diffSnippet += `\n${addedLine.content}`;

          continue;
        }

        blocks.set(key, {
          filePath: parsedFile.filePath,
          language: parsedFile.language,
          nodeType: meaningfulNode.type,
          startLine: meaningfulNode.startPosition.row + 1,
          endLine: meaningfulNode.endPosition.row + 1,
          changedLines: [addedLine.lineNumber],
          diffSnippet: addedLine.content,
          enclosingCodeBlock: AstNodeUtil.getNodeText(
            parsedFile.source,
            meaningfulNode,
          ),
        });
      }
    }

    return [...blocks.values()];
  }
}
