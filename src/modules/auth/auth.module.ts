import { Module } from '@nestjs/common';
import { AuthService } from './service/auth/auth.service';
import { AuthController } from './auth.controller';
import { RefreshTokenService } from './service/refresh-token/refresh-token.service';
import { RefreshToken } from './entity/refresh-token.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenRepository } from './repository/refresh-token.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('security.jwtSecretKey')!,
        signOptions: {
          expiresIn: '1h',
        },
      }),
    }),
    UserModule,
  ],
  providers: [AuthService, RefreshTokenService, RefreshTokenRepository],
  controllers: [AuthController],
})
export class AuthModule {}
