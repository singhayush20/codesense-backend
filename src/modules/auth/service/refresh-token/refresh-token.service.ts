import { randomUUID } from 'crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppException } from '../../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../../exception-handling/exception-codes';
import { User } from '../../../user/entity/user.entity';
import { RefreshTokenIssueDto } from '../../dto/refresh-token-issue.dto';
import { RefreshTokenRotationDto } from '../../dto/refresh-token-rotation.dto';
import { RefreshToken } from '../../entity/refresh-token.entity';
import { RefreshTokenRepository } from '../../repository/refresh-token.repository';

@Injectable()
export class RefreshTokenService {
  private static readonly TOKEN_BYTE_LENGTH = 32;

  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly configService: ConfigService,
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
    if (!refreshToken) {
      return;
    }

    const token = await this.refreshTokenRepository.findByTokenHash(
      this.hashToken(refreshToken),
    );

    if (token) {
      await this.refreshTokenRepository.revokeSession(
        token.sessionId,
        new Date(),
      );
    }
  }

  async validateRefreshToken(refreshToken: string) {
    const token = await this.findToken(refreshToken);

    if (!token) {
      throw new AppException(
        ExceptionCodes.REFREH_TOKEN_NOT_PRESENT,
        'Invalid refresh token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Expiry check
    if (token.expiresAt < new Date()) {
      throw new AppException(
        ExceptionCodes.REFRESH_TOKEN_EXPIRED,
        'Refresh token expired',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Reuse detection (VERY IMPORTANT)
    if (token.usedAt) {
      // token already used → possible replay attack
      await this.revokeSession(token.sessionId);

      throw new AppException(
        ExceptionCodes.REFRESH_TOKEN_REUSED,
        'Refresh token already used',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Revoked check
    if (token.revokedAt) {
      throw new AppException(
        ExceptionCodes.REFRESH_TOKEN_REVOKED,
        'Refresh token revoked',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return token;
  }

  private async findToken(rawToken: string) {
    if (!rawToken) {
      throw new AppException(
        ExceptionCodes.INVALID_REFRESH_TOKEN,
        'Refresh token required',
        HttpStatus.UNAUTHORIZED,
      );
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
    const tokenExpiresInMs =
      this.configService.get<number>('tokens.refreshTokenExpiresIn') ??
      7 * 24 * 60 * 60 * 1000; // 7 days;
    const expiresAt = new Date(issuedAt.getTime() + tokenExpiresInMs);

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
