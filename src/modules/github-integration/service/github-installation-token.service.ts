import { HttpService } from '@nestjs/axios';
import { Injectable, HttpStatus } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { GithubAppAuthService } from './github-app-auth.service';
import { CacheService } from '../../../cache/cache.service';
import { AppException } from '../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../exception-handling/exception-codes';

interface GithubInstallationTokenResponse {
  token: string;
  expires_at: string;
}

@Injectable()
export class GithubInstallationTokenService {
  constructor(
    private readonly authService: GithubAppAuthService,
    private readonly http: HttpService,
    private readonly cacheService: CacheService,
    @InjectPinoLogger(GithubInstallationTokenService.name)
    private readonly logger: PinoLogger,
  ) {}

  async getToken(installationId: string): Promise<string> {
    const cacheKey = `gh:inst:${installationId}`;

    // Check cache
    const cached = await this.cacheService.get<string>(cacheKey);
    if (cached) {
      return cached;
    }

    const appJwt = this.authService.generateAppJwt();

    let responseData: GithubInstallationTokenResponse;

    try {
      const response = await firstValueFrom(
        this.http.post<GithubInstallationTokenResponse>(
          `https://api.github.com/app/installations/${installationId}/access_tokens`,
          {},
          {
            headers: {
              Authorization: `Bearer ${appJwt}`,
              Accept: 'application/vnd.github+json',
            },
          },
        ),
      );

      responseData = response.data;
    } catch (error) {
      this.logger.error(
        `Failed to generate installation token ${error instanceof Error ? error.message : 'unknown error'}`,
      );

      throw new AppException(
        ExceptionCodes.GITHUB_API_ERROR,
        'Failed to generate GitHub installation token',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const token = responseData.token;

    // Calculate TTL dynamically (IMPORTANT)
    const expiresAt = new Date(responseData.expires_at).getTime();
    const now = Date.now();

    // subtract buffer (1 min)
    const ttlSeconds = Math.max(Math.floor((expiresAt - now) / 1000) - 60, 0);

    // Cache safely
    await this.cacheService.set(cacheKey, token, ttlSeconds);

    return token;
  }
}
