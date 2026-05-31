import { Injectable, Logger } from '@nestjs/common';
import { GithubFileContentResponse } from '../../dto/files/github-file-content-response.dto';
import { GithubInstallationTokenService } from '../../../github-integration/service/github-installation-token.service';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

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
}
