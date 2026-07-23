import { Controller, Post, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SsoAuthService } from './sso-auth.service';
import { CpfAuthService } from './cpf-auth.service';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private sso: SsoAuthService,
    private cpf: CpfAuthService,
  ) {}

  // Temporal para desarrollo - eliminar en producción
  @Post('dev-login')
  async devLogin(@Body() dto: { carnet: string }) {
    return this.auth.devLogin(dto.carnet);
  }

  // SSO desde el Portal (para empleados)
  @Post('sso-login')
  async ssoLogin(@Body() dto: { token: string }) {
    return this.sso.ssoLogin(dto.token);
  }

  // Login para usuarios externos CPF
  @Post('cpf-login')
  async cpfLogin(@Body() dto: { username: string; password: string }) {
    return this.cpf.login(dto.username, dto.password);
  }

  // Registro de usuario CPF (solo admin)
  @Post('cpf-register')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async cpfRegister(@Body() dto: { username: string; password: string; nombre: string; tipo: string; referenciaId?: number; edificioIdDefecto?: number }) {
    return this.cpf.register(dto);
  }

  // Cambio de contraseña CPF
  @Put('cpf-password')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'registrador')
  async cpfChangePassword(@Body() dto: { username: string; oldPassword: string; newPassword: string }, @Req() req: any) {
    // Only admin can change others' passwords
    const targetUser = req.user.cpf ? req.user.username : null;
    if (!req.user.cpf && req.user.rol !== 'admin') {
      throw new Error('No autorizado');
    }
    return this.cpf.changePassword(dto.username, dto.oldPassword, dto.newPassword);
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
