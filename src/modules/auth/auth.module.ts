import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { AuthController } from './controller/auth.controller';
import { RefreshToken } from './entity/refresh-token.entity';
import { RefreshTokenRepository } from './repository/refresh-token.repository';
import { AuthService } from './service/auth/auth.service';
import { RefreshTokenService } from './service/refresh-token/refresh-token.service';
import { JwtStrategy } from './strategy/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        defaultStrategy: 'jwt',
        secret: config.get<string>('security.jwtSecretKey')!,
      }),
    }),
    UserModule,
  ],
  providers: [
    AuthService,
    RefreshTokenService,
    RefreshTokenRepository,
    JwtStrategy,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
