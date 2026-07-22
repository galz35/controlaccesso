import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuthService {
  constructor(
    private db: DatabaseService,
    private jwt: JwtService,
  ) {}

  async devLogin(carnet: string) {
    const pool = await this.db.getPool();

    const result = await pool.request()
      .input('Carnet', carnet)
      .execute('sp_Login_Empleado');

    const user = result.recordset[0];
    if (!user) throw new UnauthorizedException('Usuario no encontrado.');

    const token = this.jwt.sign({ carnet: user.Carnet, nombre: user.Nombre, rol: user.Rol });
    return { access_token: token, user: { carnet: user.Carnet, nombre: user.Nombre, rol: user.Rol } };
  }

  async me(carnet: string) {
    const pool = await this.db.getPool();
    const result = await pool.request()
      .input('Carnet', carnet)
      .execute('sp_Login_Empleado');
    const u = result.recordset[0];
    if (!u) return null;
    return { carnet: u.Carnet, nombre: u.Nombre, rol: u.Rol };
  }
}
