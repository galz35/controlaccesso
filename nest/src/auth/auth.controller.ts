import { Controller, Post, Get, Put, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SsoAuthService } from './sso-auth.service';
import { CpfAuthService } from './cpf-auth.service';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { DevLoginDto, SsoLoginDto, CpfLoginDto, CpfRegisterDto, CpfChangePasswordDto, AdminResetPasswordDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private sso: SsoAuthService,
    private cpf: CpfAuthService,
    private config: ConfigService,
  ) {}

  // Temporal para desarrollo - deshabilitado en producción
  @Post('dev-login')
  async devLogin(@Body() dto: DevLoginDto) {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new ForbiddenException('Login de desarrollo no disponible en producción.');
    }
    return this.auth.devLogin(dto.carnet);
  }

  // SSO desde el Portal (para empleados)
  @Post('sso-login')
  async ssoLogin(@Body() dto: SsoLoginDto) {
    return this.sso.ssoLogin(dto.token);
  }

  // Login para usuarios externos CPF
  @Post('cpf-login')
  async cpfLogin(@Body() dto: CpfLoginDto) {
    return this.cpf.login(dto.username, dto.password);
  }

  // Registro de usuario CPF (solo admin)
  @Post('cpf-register')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async cpfRegister(@Body() dto: CpfRegisterDto) {
    return this.cpf.register(dto);
  }

  // Cambio de contraseña propio
  @Put('cpf-password')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'registrador')
  async cpfChangePassword(@Body() dto: CpfChangePasswordDto, @Req() req: any) {
    return this.cpf.changePassword(dto.username, dto.oldPassword, dto.newPassword);
  }

  // Restablecimiento administrativo de contraseña (solo admin, sin oldPassword)
  @Post('admin-reset-password')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async adminResetPassword(@Body() dto: AdminResetPasswordDto) {
    return this.cpf.adminResetPassword(dto.username, dto.newPassword);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@Req() req: any) {
    if (req.user.cpf) {
      return { ...req.user, tipo: 'CPF' };
    }
    return this.auth.me(req.user.carnet);
  }
}
