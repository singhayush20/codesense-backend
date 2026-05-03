import { Injectable, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

import { AppException } from '../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../exception-handling/exception-codes';
import { GithubInstallationReposResponse, GithubRepoDto } from '../dtos/github-api/github-installation-repos-api-response.dto';

@Injectable()
export class GithubApiService {
  constructor(private readonly http: HttpService) {}

  async getInstallationRepos(
    token: string,
    page: number,
    perPage: number,
  ): Promise<GithubRepoDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<GithubInstallationReposResponse>(
          'https://api.github.com/installation/repositories',
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

      return response.data.repositories;
    } catch (error) {
      const err = error as AxiosError;

      if (err.response?.status === 401) {
        throw new AppException(
          ExceptionCodes.GITHUB_AUTH_FAILED,
          'Invalid installation token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (err.response?.status === 403) {
        throw new AppException(
          ExceptionCodes.GITHUB_RATE_LIMIT,
          'GitHub rate limit exceeded',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (err.response?.status === 404) {
        throw new AppException(
          ExceptionCodes.GITHUB_INSTALLATION_NOT_FOUND,
          'Installation not found',
          HttpStatus.NOT_FOUND,
        );
      }

      throw new AppException(
        ExceptionCodes.GITHUB_API_ERROR,
        'GitHub API failure',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
