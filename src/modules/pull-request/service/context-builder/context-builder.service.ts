import { Injectable } from '@nestjs/common';

import { ChangedCodeBlockDto } from '../../dto/parsing/changed-code-block.dto';

@Injectable()
export class PrContextBuilderService {
  buildReviewContext(blocks: ChangedCodeBlockDto[]): string {
    return blocks
      .map(
        (block) => `
FILE: ${block.filePath}

LANGUAGE: ${block.language}

NODE TYPE: ${block.nodeType}

CHANGED LINES:
${block.changedLines.join(', ')}

DIFF:
${block.diffSnippet}

ENCLOSING CODE BLOCK:
${block.enclosingCodeBlock}
`,
      )
      .join('\n\n');
  }
}
