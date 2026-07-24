import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CpfAuthService {
  constructor(
    private db: DatabaseService,
    private jwt: JwtService,
  ) {}

  async register(dto: { username: string; password: string; nombre: string; tipo: string; referenciaId?: number; edificioIdDefecto?: number; correo?: string }) {
    if (dto.password.length < 6) throw new BadRequestException('La contraseña debe tener al menos 6 caracteres.');
    if (!['PROVEEDOR', 'INSTRUCTOR_EXTERNO'].includes(dto.tipo)) {
      throw new BadRequestException('Tipo inválido.');
    }

    const hash = await bcrypt.hash(dto.password, 10);
    const pool = await this.db.getPool();

    try {
      const result = await pool.request()
        .input('Username', dto.username)
        .input('PasswordHash', hash)
        .input('Nombre', dto.nombre)
        .input('Tipo', dto.tipo)
        .input('ReferenciaId', dto.referenciaId || null)
        .input('Rol', 'registrador')
        .input('EdificioIdDefecto', dto.edificioIdDefecto || null)
        .execute('sp_UsuarioCPF_Registrar');
      return result.recordset[0];
    } catch (err: any) {
      if (err.number === 51000 || err.message?.includes('51000')) throw new BadRequestException('El nombre de usuario ya existe.');
      throw err;
    }
  }

  async login(username: string, password: string) {
    const pool = await this.db.getPool();
    const result = await pool.request()
      .input('Username', username)
      .execute('sp_UsuarioCPF_Validar');

    const user = result.recordset[0];
    if (!user) throw new UnauthorizedException('Usuario o contraseña incorrectos.');

    const valid = await bcrypt.compare(password, user.PasswordHash);
    if (!valid) throw new UnauthorizedException('Usuario o contraseña incorrectos.');

    const token = this.jwt.sign({
      sub: user.Id, username: user.Username, nombre: user.Nombre,
      rol: user.Rol, tipo: user.Tipo, cpf: true,
    });

    return {
      access_token: token,
      user: { id: user.Id, username: user.Username, nombre: user.Nombre, rol: user.Rol, tipo: user.Tipo, edificioIdDefecto: user.EdificioIdDefecto || null },
    };
  }
  async changePassword(username: string, oldPassword: string, newPassword: string) {
    const pool = await this.db.getPool();
    const result = await pool.request()
      .input('Username', username)
      .execute('sp_UsuarioCPF_Validar');

    const user = result.recordset[0];
    if (!user) throw new UnauthorizedException('Usuario no encontrado.');

    const valid = await bcrypt.compare(oldPassword, user.PasswordHash);
    if (!valid) throw new UnauthorizedException('Contraseña actual incorrecta.');

    if (newPassword.length < 6) throw new BadRequestException('La nueva contraseña debe tener al menos 6 caracteres.');

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.request()
      .input('Username', username)
      .input('PasswordHash', hash)
      .execute('sp_UsuarioCPF_CambiarPassword');

    return { success: true };
  }

  async adminResetPassword(username: string, newPassword: string) {
    const pool = await this.db.getPool();
    const result = await pool.request()
      .input('Username', username)
      .execute('sp_UsuarioCPF_Validar');

    const user = result.recordset[0];
    if (!user) throw new UnauthorizedException('Usuario no encontrado.');

    if (newPassword.length < 6) throw new BadRequestException('La contraseña debe tener al menos 6 caracteres.');

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.request()
      .input('Username', username)
      .input('PasswordHash', hash)
      .execute('sp_UsuarioCPF_CambiarPassword');

    return { success: true, message: 'Contraseña restablecida por administrador.' };
  }
}
