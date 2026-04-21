import { Module } from '@nestjs/common';
import { AuthService } from './service/auth/auth.service';
import { RefreshTokenService } from './service/refresh-token/refresh-token.service';
import { RefreshToken } from './entity/refresh-token.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenRepository } from './repository/refresh-token.repository';
import { JwtStrategy } from './strategy/jwt.strategy';
import { AuthController } from './controller/auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        defaultStrategy: 'jwt',
        secret: config.get<string>('security.jwtSecretKey')!,
        signOptions: {
          expiresIn: '1h',
        },
      }),
    }),
    UserModule,
  ],
  providers: [AuthService, RefreshTokenService, RefreshTokenRepository, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
