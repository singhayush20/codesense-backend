import { HttpStatus, Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { AppException } from '../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../exception-handling/exception-codes';
import { UserRole } from '../../user/entity/user-role.entity';
import { UserService } from '../../user/service/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First try to extract from httpOnly cookie
        (req: Request) => {
          return req?.cookies?.codesense_auth_token;
        },
        // Fallback to Authorization header (for backward compatibility or API clients)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: config.get<string>('security.jwtSecretKey'),
    });
  }

  async validate(payload: any) {
    if (!payload?.sub) {
      throw new AppException(ExceptionCodes.INVALID_JWT,'Invalid token payload',HttpStatus.UNAUTHORIZED);
    }

    const user = await this.userService.findByIdWithRoles(payload.sub);

    if (!user) {
      throw new AppException(ExceptionCodes.INVALID_JWT,'Invalid token payload',HttpStatus.UNAUTHORIZED);
    }

    return {
      userId: payload.sub,
      email: payload.email,
      roles: user.userRoles.map((ur:UserRole) => ur.role.name),
    };
  }
}
