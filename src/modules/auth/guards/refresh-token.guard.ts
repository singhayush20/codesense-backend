import { CanActivate, ExecutionContext, HttpStatus, Injectable } from "@nestjs/common";
import { RefreshTokenService } from "../service/refresh-token/refresh-token.service";
import { AppException } from "../../../exception-handling/app-exception.exception";
import { ExceptionCodes } from "../../../exception-handling/exception-codes";

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(private readonly refreshTokenService: RefreshTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract refresh token from httpOnly cookie
    const refreshToken = request.cookies?.codesense_refresh_token;

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
