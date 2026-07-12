import { Injectable } from '@nestjs/common';
import { GithubFileContentResponse } from '../../dto/files/github-file-content-response.dto';
import { GithubInstallationTokenService } from '../../../github-integration/service/github-installation-token.service';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import {
  RepositorySearchResult,
  GithubCodeSearchResponse,
  PullRequestChangedFile,
  GithubPullRequestFilesResponse,
} from '../../../ai/dto/llm-tools.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class PrToolsUtilityService {
  constructor(
    private readonly githubTokenService: GithubInstallationTokenService,
    private readonly httpService: HttpService,
    @InjectPinoLogger(PrToolsUtilityService.name)
    private readonly logger: PinoLogger,
  ) {}

  async getFileForPullRequest(
    filePath: string,
    repositoryFullName: string,
    installationId: string,
    ref: string,
  ): Promise<string> {
    try {
      const token = await this.githubTokenService.getToken(installationId);

      const response = await firstValueFrom(
        this.httpService.get<GithubFileContentResponse>(
          `https://api.github.com/repos/${repositoryFullName}/contents/${filePath}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github+json',
            },
            params: {
              ref,
            },
          },
        ),
      );
      const content = response.data.content;
      const encoding = response.data.encoding;

      if (!content || encoding !== 'base64') {
        return '';
      }

      this.logger.debug(
        `File content fetched for ${filePath}, ${content.length}`,
      );

      return Buffer.from(content, 'base64').toString('utf8');
    } catch (error) {
      this.logger.error({ err: error }, `Error fetching file: ${filePath}`);
      return '';
    }
  }

  async searchRepository(
    query: string,
    repositoryFullName: string,
    installationId: string,
    limit = 5,
  ): Promise<RepositorySearchResult[]> {
    try {
      const token = await this.githubTokenService.getToken(installationId);

      const response = await firstValueFrom(
        this.httpService.get<GithubCodeSearchResponse>(
          'https://api.github.com/search/code',
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github.text-match+json',
            },
            params: {
              q: `${query} repo:${repositoryFullName}`,
              per_page: limit,
            },
          },
        ),
      );

      return (
        response.data.items?.map((item) => ({
          name: item.name,
          filePath: item.path,
          repository: item.repository?.full_name,
          score: item.score,
          sha: item.sha,
        })) ?? []
      );
    } catch (error) {
      this.logger.error({ err: error }, `Repository search failed. Query=${query}`);

      return [];
    }
  }

  async listChangedFiles(
    repositoryFullName: string,
    installationId: string,
    pullRequestNumber: number,
  ): Promise<PullRequestChangedFile[]> {
    try {
      const token = await this.githubTokenService.getToken(installationId);
      const perPage = 100;
      let page = 1;
      const files: PullRequestChangedFile[] = [];

      while (true) {
        const response = await firstValueFrom(
          this.httpService.get<GithubPullRequestFilesResponse>(
            `https://api.github.com/repos/${repositoryFullName}/pulls/${pullRequestNumber}/files`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
              },
              params: {
                per_page: perPage,
                page,
              },
            },
          ),
        );

        files.push(
          ...response.data.map((file) => ({
            filePath: file.filename,
            status: file.status,
            additions: file.additions,
            deletions: file.deletions,
            changes: file.changes,
          })),
        );

        if (response.data.length < perPage) {
          return files;
        }

        page++;
      }
    } catch (error) {
      this.logger.error({ err: error }, 'Unable to list changed files');

      return [];
    }
  }
}
