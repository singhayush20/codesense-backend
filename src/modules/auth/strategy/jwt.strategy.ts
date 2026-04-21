import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
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
    return { email: payload.sub };
  }
}
