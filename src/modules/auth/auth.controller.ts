import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthService } from './service/auth/auth.service';
import { AuthTokenResponseDto } from './dto/auth-token-response.dto';
import { LogoutDto } from './dto/logout-request.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Get('oauth/google')
    async googleLogin(@Query('code') code: string): Promise<AuthTokenResponseDto> {
        return this.authService.exchangeCodeForToken(code);
    }

    @Post('refresh')
    refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refresh(dto.refreshToken);
    }

    @Post('logout')
    logout(@Body() dto: LogoutDto) {
        return this.authService.logout(dto.refreshToken);
    }

}
