import { log } from 'console';
import fs from 'fs';
import path from 'path';

import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppException } from '../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../exception-handling/exception-codes';
import { JwtUtil } from '../utils/github-jwt.utils';

@Injectable()
export class GithubAppAuthService {
  constructor(private readonly configService: ConfigService) {
    const key = fs.readFileSync(
      path.resolve(process.cwd(), 'github-app.pem'),
      'utf-8',
    );

    this.githubAppKey = key;
  }

  private readonly logger = new Logger(GithubAppAuthService.name);
  private readonly githubAppKey;

  generateAppJwt(): string {
    const appId = this.configService.get<string>('github.appId');

    if (!appId) {
      this.logger.error('GitHub App credentials are not properly configured.');

      throw new AppException(
        ExceptionCodes.GITHUB_APP_CREDENTIALS_NOT_CONFIGURED,
        'GitHub App credentials are not properly configured.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return JwtUtil.generateGithubAppJwt(appId, this.githubAppKey);
  }
}
