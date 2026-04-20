import { CanActivate, ExecutionContext, HttpStatus, Injectable } from "@nestjs/common";
import { AppException } from "src/exception-handling/app-exception.exception";
import { ExceptionCodes } from "src/exception-handling/exception-codes";
import { AuthService } from "../service/auth/auth.service";
import { RefreshTokenService } from "../service/refresh-token/refresh-token.service";

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(private readonly refreshTokenService: RefreshTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const refreshToken = request.body?.refreshToken;

    if (!refreshToken) {
      throw new AppException(ExceptionCodes.REFREH_TOKEN_NOT_PRESENT,'Refresh token missing',HttpStatus.UNAUTHORIZED);
    }

    const session =
      await this.refreshTokenService.validateRefreshToken(refreshToken);

    if (!session) {
      throw new AppException(
        ExceptionCodes.INVALID_REFRESH_TOKEN,
        'Refresh token is invalid',
        HttpStatus.UNAUTHORIZED,
      );
    }

    request.user = session.user;
    request.session = session;

    return true;
  }
}
