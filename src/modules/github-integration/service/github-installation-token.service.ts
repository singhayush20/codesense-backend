import { HttpService } from "@nestjs/axios";
import { GithubAppAuthService } from "./github-app-auth.service";
import { Injectable } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { CacheService } from "../../../cache/cache.service";

/**
 * This class is the "worker" It uses the JWT from the first
 * GithubAppAuthService to get a real API token that can
 * actually modify repositories.
 */
@Injectable()
export class GithubInstallationTokenService {
    constructor(
        private readonly authService: GithubAppAuthService,
        private readonly http: HttpService,
        private cacheService: CacheService,
    ){}

    async getToken(installationId: string): Promise<string> {
      const cacheKey = `gh:inst:${installationId}`;

      const cached = await this.cacheService.get<string>(cacheKey);

      if (cached) {
        return cached;
      }

      const jwt = this.authService.generateAppJwt();

      const response = await firstValueFrom(
        this.http.post(
          `https://api.github.com/app/installations/${installationId}/access_tokens`,
          {},
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
              Accept: 'application/vnd.github+json',
            },
          },
        ),
      );

      const token = response.data.token;

      // GitHub installation tokens are valid for 1 hour, it’s much faster to reuse a cached one than to request a new one on every API call.
      await this.cacheService.set(cacheKey, token, 3000);

      return token;
    }
}