import { Injectable } from '@nestjs/common';

import { DiffHunkDto, DiffLineDto } from '../../dto/parsing/diff-hunk.dto';

@Injectable()
export class DiffParserService {
  parsePatch(patch: string): DiffHunkDto[] {
    const hunks: DiffHunkDto[] = [];

    const lines = patch.split('\n');

    let currentHunk: DiffHunkDto | null = null;

    let oldLine = 0;
    let newLine = 0;

    for (const line of lines) {
      if (line.startsWith('@@')) {
        const match = /@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/.exec(line);

        if (!match) {
          continue;
        }

        currentHunk = {
          oldStartLine: Number(match[1]),

          oldLineCount: Number(match[2] || '0'),

          newStartLine: Number(match[3]),

          newLineCount: Number(match[4] || '0'),

          addedLines: [],

          deletedLines: [],
        };

        hunks.push(currentHunk);

        oldLine = currentHunk.oldStartLine;

        newLine = currentHunk.newStartLine;

        continue;
      }

      if (!currentHunk) {
        continue;
      }

      if (line.startsWith('+')) {
        const diffLine: DiffLineDto = {
          lineNumber: newLine,

          content: line,
        };

        currentHunk.addedLines.push(diffLine);

        newLine++;

        continue;
      }

      if (line.startsWith('-')) {
        const diffLine: DiffLineDto = {
          lineNumber: oldLine,

          content: line,
        };

        currentHunk.deletedLines.push(diffLine);

        oldLine++;

        continue;
      }

      oldLine++;
      newLine++;
    }

    return hunks;
  }
}
