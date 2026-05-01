import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthSuccessResponseDto } from '../dto/auth-success-response.dto';
import { AuthTokenResponseDto } from '../dto/auth-token-response.dto';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { RefreshTokenGuard } from '../guards/refresh-token.guard';
import { AuthService } from '../service/auth/auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('oauth2/google')
  async googleLogin(
    @Query('code') code: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSuccessResponseDto> {
    const tokens = await this.authService.exchangeCodeForToken(code);
    this.setAuthCookies(response, tokens);
    return new AuthSuccessResponseDto(true);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSuccessResponseDto> {
    const refreshToken = request.cookies?.codesense_refresh_token;

    const tokens = await this.authService.refresh(refreshToken);
    this.setAuthCookies(response, tokens);

    return new AuthSuccessResponseDto(true);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth('access-token')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSuccessResponseDto> {
    const refreshToken = request.cookies?.codesense_refresh_token;

    await this.authService.logout(refreshToken);

    this.clearAuthCookies(response);

    return new AuthSuccessResponseDto(true);
  }

  private setAuthCookies(
    response: Response,
    tokens: AuthTokenResponseDto,
  ): void {
    const cookieConfig = this.configService.get('cookies');
    const tokenMaxAge = this.configService.get('cookies.maxAge');

    const baseOptions = {
      httpOnly: true,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite as 'lax' | 'strict' | 'none',
      path: cookieConfig.path,
      domain: cookieConfig.domain,
    };

    response.cookie('codesense_auth_token', tokens.accessToken, {
      ...baseOptions,
      maxAge: tokenMaxAge.accessToken,
    });

    response.cookie('codesense_refresh_token', tokens.refreshToken, {
      ...baseOptions,
      maxAge: tokenMaxAge.refreshToken,
    });
  }

  private clearAuthCookies(response: Response): void {
    const cookieConfig = this.configService.get('cookies');

    const options = {
      path: cookieConfig.path,
      domain: cookieConfig.domain,
    };

    response.clearCookie('codesense_auth_token', options);
    response.clearCookie('codesense_refresh_token', options);
  }
}
