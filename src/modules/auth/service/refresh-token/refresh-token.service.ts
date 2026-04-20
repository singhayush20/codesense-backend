import {
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RefreshTokenIssueDto } from 'src/modules/auth/dto/refresh-token-issue.dto';
import { RefreshTokenRotationDto } from 'src/modules/auth/dto/refresh-token-rotation.dto';
import { RefreshToken } from 'src/modules/auth/entity/refresh-token.entity';
import { RefreshTokenRepository } from 'src/modules/auth/repository/refresh-token.repository';
import { AppException } from 'src/exception-handling/app-exception.exception';
import { ExceptionCodes } from 'src/exception-handling/exception-codes';
import { User } from 'src/modules/user/entity/user.entity';

@Injectable()
export class RefreshTokenService {
  private static readonly TOKEN_BYTE_LENGTH = 32;

  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async issue(
    user: User,
    sessionId: string = randomUUID(),
  ): Promise<CreatedRefreshToken> {
    return this.createRefreshToken(user, sessionId, new Date());
  }

  async rotate(refreshToken: string): Promise<RefreshTokenRotationDto> {
    const currentToken = await this.findToken(refreshToken);
    const now = new Date();

    // if revoked, throw an exception
    if (currentToken.revokedAt) {
      throw new AppException(
        ExceptionCodes.INVALID_REFRESH_TOKEN,
        'Refresh token revoked',
        HttpStatus.UNAUTHORIZED,
      );
    } else if (currentToken.expiresAt < now) {
      throw new AppException(
        ExceptionCodes.INVALID_REFRESH_TOKEN,
        'Refresh token expired',
        HttpStatus.UNAUTHORIZED,
      );
    } else if (currentToken.usedAt || currentToken.replacedByTokenId) {
      await this.refreshTokenRepository.revokeSession(
        currentToken.sessionId,
        now,
      );

      throw new AppException(
        ExceptionCodes.REFRESH_TOKEN_REUSED,
        'Refresh token already used',
        HttpStatus.UNAUTHORIZED,
      );
    } else {
      // rotation
      const newToken = await this.createRefreshToken(
        currentToken.user,
        currentToken.sessionId,
        now,
      );

      currentToken.usedAt = now;
      currentToken.replacedByTokenId = newToken.refreshToken.id;

      await this.refreshTokenRepository.save(currentToken);

      return {
        user: currentToken.user,
        refreshTokenIssue: newToken.refreshTokenIssue,
      };
    }
  }

  async revokeSession(refreshToken: string) {
    if (!refreshToken) return;

    const token = await this.refreshTokenRepository.findByTokenHash(this.hashToken(refreshToken));

    if (token) {
      await this.refreshTokenRepository.revokeSession(
        token.sessionId,
        new Date(),
      );
    }
  }

  private async findToken(rawToken: string) {
    if (!rawToken) {
      throw new AppException(ExceptionCodes.INVALID_REFRESH_TOKEN,'Refresh token required', HttpStatus.UNAUTHORIZED);
    }

    const token = await this.refreshTokenRepository.findByTokenHash(
      this.hashToken(rawToken),
    );

    if (!token) {
        throw new AppException(
          ExceptionCodes.INVALID_REFRESH_TOKEN,
          'Invalid refresh token',
          HttpStatus.UNAUTHORIZED,
        );
    }

    return token;
  }

  private async createRefreshToken(
    user: User,
    sessionId: string,
    issuedAt: Date,
  ): Promise<CreatedRefreshToken> {
    const rawToken = this.generateToken();

    const expiresAt = new Date(issuedAt.getTime() + 30 * 60 * 60 * 1000);

    const entity = await this.refreshTokenRepository.save({
      user,
      sessionId,
      tokenHash: this.hashToken(rawToken),
      expiresAt,
    });

    return {
      refreshToken: entity,
      refreshTokenIssue: {
        token: rawToken,
        expiresAt,
        sessionId,
      },
    };
  }

  private generateToken(): string {
    return require('crypto')
      .randomBytes(RefreshTokenService.TOKEN_BYTE_LENGTH)
      .toString('base64url');
  }

  private hashToken(token: string): string {
    return require('crypto').createHash('sha256').update(token).digest('hex');
  }
}

class CreatedRefreshToken {
    refreshToken!: RefreshToken;
    refreshTokenIssue!: RefreshTokenIssueDto;
}