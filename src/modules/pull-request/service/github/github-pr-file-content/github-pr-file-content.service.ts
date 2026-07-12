import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { GithubInstallationTokenService } from '../../../../github-integration/service/github-installation-token.service';
import { GithubRepository } from '../../../../github-integration/entity/github-repo.entity';
import { GithubFileContentResponse } from '../../../dto/files/github-file-content-response.dto';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class GithubPrFileContentService {
  constructor(
    private readonly httpService: HttpService,
    private readonly githubTokenService: GithubInstallationTokenService,
    @InjectPinoLogger(GithubPrFileContentService.name)
    private readonly logger: PinoLogger,
  ) {}

  async fetchFileContent(
    repository: GithubRepository,
    filePath: string,
    ref: string,
  ): Promise<string> {
    try {
      const token = await this.githubTokenService.getToken(
        repository.installation.installationId,
      );

      this.logger.debug(`Fetching file from github: ${filePath}, base: ${ref}`);

      const response = await firstValueFrom(
        this.httpService.get<GithubFileContentResponse>(
          `https://api.github.com/repos/${repository.fullName}/contents/${filePath}`,
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
      if (error instanceof AxiosError) {
        const status = error.response?.status;

        if (status === 404 || status === 409 || status === 422) {
          this.logger.warn({
            message: 'Skipping unavailable file',

            repository: repository.fullName,

            filePath,

            ref,

            status,
          });

          return '';
        }
      }
      throw error;
    }
  }
}
