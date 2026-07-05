import { tool } from 'ai';
import { z } from 'zod';
import { PrToolsUtilityService } from '../../pull-request/service/pr-tools-utility/pr-tools-utility.service';

import { Injectable } from '@nestjs/common';
import { AiToolContext } from '../dto/llm-tools.dto';

@Injectable()
export class AiTools {
  constructor(private readonly utilityService: PrToolsUtilityService) {}

  createTools(context: AiToolContext) {
    return {
      getFileContent: tool({
        description: `Read the complete contents of a repository file.

Use this whenever you need to inspect code that is not already present.
Never guess the contents of a file.`,

        inputSchema: z.object({
          filePath: z.string(),
        }),

        execute: async ({ filePath }) => {
          const content = await this.utilityService.getFileForPullRequest(
            filePath,
            context.repositoryFullName,
            context.installationId,
            context.headSha,
          );

          return {
            filePath,
            content,
          };
        },
      }),

      searchRepository: tool({
        description: `Search the repository for files matching a text query.
Use this tool to locate files before reading them.`,

        inputSchema: z.object({
          query: z.string(),
          limit: z.number().min(1).max(10).default(5),
        }),

        execute: ({ query, limit }) =>
          this.utilityService.searchRepository(
            query,
            context.repositoryFullName,
            context.installationId,
            limit,
          ),
      }),

      listChangedFiles: tool({
        description: `List all files changed in the current pull request.
Use this tool to understand which files were modified before requesting file contents.`,

        inputSchema: z.object({}),

        execute: () =>
          this.utilityService.listChangedFiles(
            context.repositoryFullName,
            context.installationId,
            context.pullRequestNumber,
          ),
      }),
    };
  }
}
