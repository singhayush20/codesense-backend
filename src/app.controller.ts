import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './modules/auth/guards/jwt.guard';

@Controller('app')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('test')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test/auth')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  getHelloWithAuth(): string {
    return this.appService.getHello();
  }
}
