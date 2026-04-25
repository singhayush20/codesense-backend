import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { GithubInstallationTokenService } from '../github-installation-token.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { GithubPullRequestEventPayload, GithubPrFile, GithubIssueCommentResponse } from '../../dtos/pr-handling/github-pr.dto';
import { AppException } from '../../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../../exception-handling/exception-codes';

@Injectable()
export class PrProcessingService {
  private readonly logger = new Logger(PrProcessingService.name);

  constructor(
    private readonly tokenService: GithubInstallationTokenService,
    private readonly http: HttpService,
  ) {}

  async processPullRequest(
    payload: GithubPullRequestEventPayload,
  ): Promise<void> {
    const installationId = payload.installation.id;
    const repoFullName = payload.repository.full_name;
    const prNumber = payload.pull_request.number;

    const [owner, repo] = repoFullName.split('/');

    try {
      const token = await this.tokenService.getToken(installationId.toString());

      const files = await this.getPrFiles(owner, repo, prNumber, token);

      this.logger.log(
        `PR ${prNumber} | Repo ${repoFullName} | Files fetched: ${files.length}`,
      );

      // TODO: AI pipeline

      await this.commentOnPr(
        owner,
        repo,
        prNumber,
        token,
        'PR received. Analysis will be added soon.',
      );
    } catch (error) {
      this.handleError(
        error,
        `Failed processing PR ${prNumber} for repo ${repoFullName}`,
      );
    }
  }

  private async getPrFiles(
    owner: string,
    repo: string,
    prNumber: number,
    token: string,
  ): Promise<GithubPrFile[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<GithubPrFile[]>(
          `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`,
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
      this.handleError(
        error,
        `Failed fetching PR files: ${owner}/${repo}#${prNumber}`,
      );
    }
  }

  private async commentOnPr(
    owner: string,
    repo: string,
    prNumber: number,
    token: string,
    comment: string,
  ): Promise<GithubIssueCommentResponse> {
    try {
      const response = await firstValueFrom(
        this.http.post<GithubIssueCommentResponse>(
          `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`,
          { body: comment },
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
      this.handleError(
        error,
        `Failed commenting on PR: ${owner}/${repo}#${prNumber}`,
      );
    }
  }

  private handleError(error: unknown, context: string): never {
    if (error instanceof AxiosError) {
      this.logger.error(
        `${context} | GitHub API Error: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`,
      );

      throw new AppException(
        ExceptionCodes.GITHUB_API_ERROR,
        'GitHub API error',
        error.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }

    this.logger.error(`${context} | Unknown Error`, error as any);

    throw new AppException(
      ExceptionCodes.PR_PROCESSING_ERROR,
      'Error processing PR',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
