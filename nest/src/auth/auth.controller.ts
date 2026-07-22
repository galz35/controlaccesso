import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('dev-login')
  async devLogin(@Body() dto: { carnet: string }) {
    return this.auth.devLogin(dto.carnet);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@Req() req: any) {
    return this.auth.me(req.user.carnet);
  }
}
