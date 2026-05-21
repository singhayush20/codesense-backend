import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ExtractJwt,
  Strategy,
  type JwtFromRequestFunction,
} from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../exception-handling/exception-codes';
import { UserRole } from '../../user/entity/user-role.entity';
import { UserService } from '../../user/service/user.service';
import { JwtPayload } from '../dto/jwt-payload.dto';
import { RequestWithCookies } from '../dto/cookie-request.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly userService: UserService,
  ) {
    const cookieExtractor: JwtFromRequestFunction = (
      req: RequestWithCookies | null,
    ): string | null => {
      return req?.cookies?.codesense_auth_token ?? null;
    };

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: config.getOrThrow<string>('security.jwtSecretKey'),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload?.sub) {
      throw new AppException(
        ExceptionCodes.INVALID_JWT,
        'Invalid token payload',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.userService.findByIdWithRoles(payload.sub);

    if (!user) {
      throw new AppException(
        ExceptionCodes.INVALID_JWT,
        'Invalid token payload',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return {
      userId: payload.sub,
      email: payload.email,
      roles: user.userRoles.map((ur: UserRole) => ur.role.name),
    };
  }
}
