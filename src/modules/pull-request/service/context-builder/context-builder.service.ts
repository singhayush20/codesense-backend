import { Injectable, Logger } from '@nestjs/common';
import { PullRequestFile } from '../../entity/pull-request-file.entity';
import { StructuredHunk } from '../../dto/review/pr-review-context.dto';

@Injectable()
export class PrContextBuilderService {
  private readonly logger = new Logger(PrContextBuilderService.name);

  // Define files that shouldn't waste LLM resources
  private readonly ignoredExtensions = [
    '.json',
    '.lock',
    '.yaml',
    '.yml',
    '.md',
  ];

  buildReviewContextForFile(file: PullRequestFile): string {
    // 1. Skip check for ignored formats or asset files
    if (this.shouldIgnoreFile(file.fileName)) {
      return `[File ${file.fileName} omitted: File type excluded from AI review]`;
    }

    // 2. Guard against massive single-file patches that ruin token windows
    const MAX_PATCH_LENGTH = 40000; // ~40KB characters limit
    if (file.patch && file.patch.length > MAX_PATCH_LENGTH) {
      return `[File ${file.fileName} omitted: Patch change scope is too large (${file.patch.length} characters)]`;
    }

    if (!file.patch) {
      return `[File ${file.fileName} has no patch data available (e.g., empty or binary file)]`;
    }

    // 3. Parse unified diff into structured lines with accurate line anchoring
    try {
      const structuredHunks = this.parseUnifiedDiff(file.patch);
      return JSON.stringify(structuredHunks, null, 2);
    } catch (error) {
      this.logger.warn(
        `Error parsing unified diff for file ${file.fileName}: ${error}`,
      );
      return `[Raw Patch Data Due to Parsing Fallback]\n${file.patch}`;
    }
  }

  private shouldIgnoreFile(fileName: string): boolean {
    const lowerName = fileName.toLowerCase();
    return (
      this.ignoredExtensions.some((ext) => lowerName.endsWith(ext)) ||
      lowerName.includes('lock')
    );
  }

  private parseUnifiedDiff(patch: string): StructuredHunk[] {
    const lines = patch.split('\n');
    const hunks: StructuredHunk[] = [];

    let currentHunk: StructuredHunk | null = null;
    let oldLineCursor = 0;
    let newLineCursor = 0;

    // Regex matching git hunk header syntax: @@ -oldStart,oldLength +newStart,newLength @@
    const hunkHeaderRegex = /^@@\s+-(\d+),?(\d*)\s+\+(\d+),?(\d*)\s+@@/;

    for (const line of lines) {
      const headerMatch = line.match(hunkHeaderRegex);

      if (headerMatch) {
        // Wrap previous hunk if it exists
        if (currentHunk) {
          hunks.push(currentHunk);
        }

        oldLineCursor = parseInt(headerMatch[1], 10);
        newLineCursor = parseInt(headerMatch[3], 10);

        currentHunk = {
          header: line,
          lines: [],
        };
        continue;
      }

      if (!currentHunk) {
        // Skip metadata lines before first hunk header (e.g. "index 0000000..1234567")
        continue;
      }

      if (line.startsWith('+')) {
        currentHunk.lines.push({
          type: 'addition',
          newLineNumber: newLineCursor,
          content: line.substring(1), // Strip the leading '+'
        });
        newLineCursor++;
      } else if (line.startsWith('-')) {
        currentHunk.lines.push({
          type: 'deletion',
          oldLineNumber: oldLineCursor,
          content: line.substring(1), // Strip the leading '-'
        });
        oldLineCursor++;
      } else {
        // Context line (usually starts with space ' ' or empty)
        currentHunk.lines.push({
          type: 'context',
          oldLineNumber: oldLineCursor,
          newLineNumber: newLineCursor,
          content: line.startsWith(' ') ? line.substring(1) : line,
        });
        oldLineCursor++;
        newLineCursor++;
      }
    }

    if (currentHunk) {
      hunks.push(currentHunk);
    }

    return hunks;
  }
}
