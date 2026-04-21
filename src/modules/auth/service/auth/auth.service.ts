import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/modules/user/user.service';
import axios from 'axios';
import { randomBytes, randomUUID } from 'crypto';
import { AuthTokenResponseDto } from '../../dto/auth-token-response.dto';
import { User } from 'src/modules/user/entity/user.entity';
import { RefreshTokenService } from '../refresh-token/refresh-token.service';
import { ExceptionCodes } from 'src/exception-handling/exception-codes';
import { AppException } from 'src/exception-handling/app-exception.exception';

@Injectable()
export class AuthService {
  private static readonly BEARER = 'Bearer';

  constructor(
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly config: ConfigService,
    private readonly userService: UserService,
  ) {}

  async exchangeCodeForToken(code: string): Promise<AuthTokenResponseDto> {
    try {
      // 1. Exchange code → token
      const tokenResponse = await axios.post(
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

      const idToken = tokenResponse?.data?.id_token;

      if (!idToken) {
        throw new AppException(
          ExceptionCodes.GOOGLE_INVALID_TOKEN_RESPONSE,
          'Invalid token response from Google',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // 2. Fetch user info
      const userInfoResponse = await axios.get(
        `${this.config.get<string>('oauth.google.tokenInfoUrl')}${idToken}`,
      );

      const userInfo = userInfoResponse?.data;

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
      const expiresInSeconds = this.config.get<number>('tokens.accessTokenExpiresInSeconds') ?? 3600;

      const accessToken = this.jwtService.sign(
        { sub: user.email },
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

      return new AuthTokenResponseDto(
        accessToken,
        refreshToken.refreshTokenIssue.token,
        AuthService.BEARER,
        accessTokenExpiresAt,
        refreshToken.refreshTokenIssue.expiresAt,
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new AppException(
          ExceptionCodes.GOOGLE_OAUTH_LOGIN_FAILED,
          error.response?.data || 'Google OAuth failed',
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

  async refresh(refreshToken: string): Promise<AuthTokenResponseDto> {
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
      { sub: rotation.user.email },
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

  async logout(refreshToken: string): Promise<void> {
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

  private resolveName(userInfo: any, email: string): string {
    return userInfo.name && userInfo.name.trim().length > 0
      ? userInfo.name
      : email;
  }

  private generateRandomPassword(): string {
    return randomBytes(32).toString('hex');
  }
}
