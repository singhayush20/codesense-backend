import { tool } from 'ai';
import { z } from 'zod';
import { PrToolsUtilityService } from '../../pull-request/service/pr-tools-utility/pr-tools-utility.service';

export class AiTools {
  constructor(private readonly pullRequestFileService: PrToolsUtilityService) {}

  getFileContentTool = tool({
    description:
      'Fetch the complete content of a repository file using its path.',
    inputSchema: z.object({
      filePath: z
        .string()
        .describe('Relative path of the file in the repository'),
      headSha: z.string().describe('The head SHA of the pull request'),
      installationId: z.string().describe('The GitHub App installation ID'),
      repositoryFullName: z
        .string()
        .describe('The full name of the repository, e.g. owner/repo'),
    }),

    execute: async ({
      filePath,
      headSha,
      installationId,
      repositoryFullName,
    }) => {
      const content = await this.pullRequestFileService.getFileForPullRequest(
        filePath,
        repositoryFullName,
        installationId,
        headSha,
      );

      return {
        filePath,
        content,
      };
    },
  });

  searchRepositoryTool = tool({
    description:
      'Search the repository for files, classes, methods, strings or symbols. Use this tool when you need to locate code before reading a file.',

    inputSchema: z.object({
      query: z
        .string()
        .describe(
          'The search query. Examples: UserService, validatePermission, JWT_SECRET',
        ),
      installationId: z.string(),
      repositoryFullName: z.string(),
      limit: z.number().min(1).max(10).default(5),
    }),

    execute: async ({ query, installationId, repositoryFullName, limit }) => {
      return this.pullRequestFileService.searchRepository(
        query,
        repositoryFullName,
        installationId,
        limit,
      );
    },
  });
}
