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
}
