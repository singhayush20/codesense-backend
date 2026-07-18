import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { randomBytes, randomUUID } from 'crypto';
import { AuthTokenResponseDto } from '../../dto/auth-token-response.dto';
import { RefreshTokenService } from '../refresh-token/refresh-token.service';
import { AppException } from '../../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../../exception-handling/exception-codes';
import { User } from '../../../user/entity/user.entity';
import { UserService } from '../../../user/service/user.service';
import { GoogleUserInfoResponse } from '../../dto/google-user-info-response.dto';
import { GoogleTokenResponse } from '../../dto/google-token-response.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class AuthService {
  private static readonly BEARER = 'Bearer';

  constructor(
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly config: ConfigService,
    private readonly userService: UserService,
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
  ) {}

  async exchangeCodeForToken(code: string): Promise<AuthTokenResponseDto> {
    try {
      // 1. Exchange code → token
      const tokenResponse = await axios.post<GoogleTokenResponse>(
        this.config.get<string>('oauth.google.tokenUrl')!,
        new URLSearchParams({
          code,
          client_id: this.config.get<string>('oauth.google.clientId')!,
          client_secret: this.config.get<string>('oauth.google.clientSecret')!,
          redirect_uri: this.config.get<string>('oauth.google.redirectUrl')!,
          grant_type: 'authorization_code',
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      this.logger.debug('Token response from google: %o', tokenResponse.data);

      const idToken = tokenResponse?.data?.id_token;
      const googleAccessToken = tokenResponse?.data?.access_token;

      if (!idToken || !googleAccessToken) {
        throw new AppException(
          ExceptionCodes.GOOGLE_INVALID_TOKEN_RESPONSE,
          'Invalid token response from Google',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // 2. Fetch user info
      const userInfoResponse = await axios.get<GoogleUserInfoResponse>(
        `${this.config.get<string>('oauth.google.userInfoUrl')}`,
        {
          headers: {
            Authorization: `${AuthService.BEARER} ${googleAccessToken}`,
          },
        },
      );

      const userInfo = userInfoResponse?.data;

      this.logger.debug('User info from google: %o', userInfo);

      if (!userInfo || !userInfo.email) {
        throw new AppException(
          ExceptionCodes.GOOGLE_USER_INFO_FETCH_FAILED,
          'Failed to fetch user info from Google',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const email = userInfo.email;
      const name = this.resolveName(userInfo, email);

      // 3. Find or create user (exact Spring behavior)
      const user = await this.findOrCreateGoogleUser(email, name);

      // 4. Validate user state
      this.validateUserState(user);

      // 5. Generate access token
      const expiresInSeconds =
        this.config.get<number>('tokens.accessTokenExpiresInSeconds') ?? 3600;

      const accessToken = this.jwtService.sign(
        {
          sub: user.userId,
          email: user.email,
        },
        { expiresIn: expiresInSeconds },
      );

      const accessTokenExpiresAt = new Date(
        Date.now() + expiresInSeconds * 1000,
      );

      // 6. Issue refresh token (new session)
      const refreshToken = await this.refreshTokenService.issue(
        user,
        randomUUID(),
      );

      this.logger.debug(
        'Issued refresh token: %o',
        refreshToken.refreshTokenIssue,
      );

      return new AuthTokenResponseDto(
        accessToken,
        refreshToken.refreshTokenIssue.token,
        AuthService.BEARER,
        accessTokenExpiresAt,
        refreshToken.refreshTokenIssue.expiresAt,
      );
    } catch (error) {
      this.logger.error('Google OAuth login failed | error=%o', error);
      if (axios.isAxiosError(error)) {
        throw new AppException(
          ExceptionCodes.GOOGLE_OAUTH_LOGIN_FAILED,
          'Google OAuth failed',
          HttpStatus.UNAUTHORIZED,
        );
      }

      throw new AppException(
        ExceptionCodes.GOOGLE_OAUTH_LOGIN_FAILED,
        'Google OAuth login failed',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  async refresh(
    refreshToken: string | undefined,
  ): Promise<AuthTokenResponseDto> {
    if (refreshToken === undefined) {
      throw new AppException(
        ExceptionCodes.REFREH_TOKEN_NOT_PRESENT,
        'Refresh token missing',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const rotation = await this.refreshTokenService.rotate(refreshToken);

    try {
      this.validateUserState(rotation.user);
    } catch (error) {
      await this.refreshTokenService.revokeSession(
        rotation.refreshTokenIssue.token,
      );
      throw error;
    }

    const expiresInSeconds =
      this.config.get<number>('tokens.accessTokenExpiresInSeconds') ?? 3600;

    const accessToken = this.jwtService.sign(
      { sub: rotation.user.userId, email: rotation.user.email },
      { expiresIn: expiresInSeconds },
    );

    const accessTokenExpiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    return new AuthTokenResponseDto(
      accessToken,
      rotation.refreshTokenIssue.token,
      AuthService.BEARER,
      accessTokenExpiresAt,
      rotation.refreshTokenIssue.expiresAt,
    );
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken === undefined) {
      return;
    }
    await this.refreshTokenService.revokeSession(refreshToken);
  }

  private async findOrCreateGoogleUser(
    email: string,
    name: string,
  ): Promise<User> {
    const user = await this.userService.findUserByEmail(email);
    if (user !== null) {
      return user;
    }

    return this.userService.createUser(
      email,
      name,
      this.generateRandomPassword(),
    );
  }

  private validateUserState(user: User) {
    if (!user.isActive || !user.isVerified) {
      throw new AppException(
        ExceptionCodes.USER_ACCOUNT_DISABLED,
        'User account is not active or verified',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  private resolveName(userInfo: GoogleUserInfoResponse, email: string): string {
    const name = userInfo.name?.trim();

    return name && name.length > 0 ? name : email;
  }

  private generateRandomPassword(): string {
    return randomBytes(32).toString('hex');
  }
}
