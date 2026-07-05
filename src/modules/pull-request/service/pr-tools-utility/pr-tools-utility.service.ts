import { Injectable, Logger } from '@nestjs/common';
import { GithubFileContentResponse } from '../../dto/files/github-file-content-response.dto';
import { GithubInstallationTokenService } from '../../../github-integration/service/github-installation-token.service';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import {
  RepositorySearchResult,
  GithubCodeSearchResponse,
} from '../../../ai/dto/llm-tools.dto';

@Injectable()
export class PrToolsUtilityService {
  private readonly logger = new Logger(PrToolsUtilityService.name);

  constructor(
    private readonly githubTokenService: GithubInstallationTokenService,
    private readonly httpService: HttpService,
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
      this.logger.error(`Error fetching file: ${filePath}`, error);
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

      return response.data.items.map((item) => ({
        filePath: item.path,
        repository: item.repository.full_name,
        score: item.score,
        snippet: item.text_matches?.[0]?.fragment ?? null,
      }));
    } catch (error) {
      this.logger.error(`Repository search failed. Query=${query}`, error);

      return [];
    }
  }
}
