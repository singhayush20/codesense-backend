import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtUtil } from '../utils/github-jwt.utils';
import { AppException } from '../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../exception-handling/exception-codes';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class GithubAppAuthService {
  constructor(
    private readonly configService: ConfigService,
    @InjectPinoLogger(GithubAppAuthService.name)
    private readonly logger: PinoLogger,
  ) {
    const key = configService.get<string>('github.privateKey');

    if (!key) {
      this.logger.error('GitHub App credentials are not properly configured.');
      throw new AppException(
        ExceptionCodes.GITHUB_APP_CREDENTIALS_NOT_CONFIGURED,
        'GitHub App credentials are not properly configured.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    this.githubAppKey = key;
  }

  private readonly githubAppKey: string;

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
