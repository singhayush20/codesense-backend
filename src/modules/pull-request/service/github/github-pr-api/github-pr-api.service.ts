import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { GithubInstallationTokenService } from '../../../../github-integration/service/github-installation-token.service';
import { HttpService } from '@nestjs/axios';
import { GithubRepository } from '../../../../github-integration/entity/github-repo.entity';
import { GithubPullRequestResponse } from '../../../dto/pull-request/github-pull-request-response.dto';
import { firstValueFrom } from 'rxjs';
import { AppException } from '../../../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../../../exception-handling/exception-codes';
import { AxiosError } from 'axios';
import { GithubPullRequestFileResponse } from '../../../dto/pull-request/github-pull-request-file-response.dto';

@Injectable()
export class GithubPrApiService {
  private logger = new Logger(GithubPrApiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly githubInstallationTokenService: GithubInstallationTokenService,
  ) {}

  async fetchPullRequest(
    repository: GithubRepository,
    prNumber: number,
  ): Promise<GithubPullRequestResponse> {
    try {
      const token = await this.githubInstallationTokenService.getToken(
        repository.installation.installationId,
      );

      const response = await firstValueFrom(
        this.httpService.get<GithubPullRequestResponse>(
          `https://api.github.com/repos/${repository.fullName}/pulls/${prNumber}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github+json',
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.handleGithubError(error, repository.fullName, prNumber);
    }
  }

  async fetchPullRequestFiles(
    repository: GithubRepository,
    prNumber: number,
  ): Promise<GithubPullRequestFileResponse[]> {
    const token = await this.githubInstallationTokenService.getToken(
      repository.installation.installationId,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.get<GithubPullRequestFileResponse[]>(
          `https://api.github.com/repos/${repository.fullName}/pulls/${prNumber}/files`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github+json',
            },
            params: {
              per_page: 100,
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.handleGithubError(error, repository.fullName, prNumber);
    }
  }

  private handleGithubError(
    error: unknown,
    repositoryName: string,
    prNumber: number,
  ): never {
    if (error instanceof AxiosError) {
      this.logger.error({
        repositoryName,
        prNumber,
        status: error.response?.status,
        message: JSON.stringify(error.response?.data),
      });

      throw new AppException(
        ExceptionCodes.GITHUB_API_ERROR,
        'GitHub API request failed',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    throw error;
  }
}
