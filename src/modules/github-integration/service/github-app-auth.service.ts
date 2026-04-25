import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtUtil } from '../utils/github-jwt.utils';
import { AppException } from '../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../exception-handling/exception-codes';

@Injectable()
export class GithubAppAuthService {
  constructor(private readonly configService: ConfigService) {}

  generateAppJwt(): string {
    const appId = this.configService.get<string>('github.app.id');
    const privateKey = this.configService.get<string>('github.privateKey');

    if (!appId || !privateKey) {
      
      throw new AppException(ExceptionCodes.GITHUB_APP_CREDENTIALS_NOT_CONFIGURED, 'GitHub App credentials are not properly configured.',HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return JwtUtil.generateGithubAppJwt(appId, privateKey);
  }
}