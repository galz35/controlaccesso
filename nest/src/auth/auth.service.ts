import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import * as sql from 'mssql';

@Injectable()
export class AuthService {
  constructor(
    private db: DatabaseService,
    private jwt: JwtService,
  ) {}

  async devLogin(carnet: string) {
    const pool = await this.db.getPool();

    // Find user in Portal
    const result = await pool.request()
      .input('carnet', sql.VarChar(50), carnet)
      .query('SELECT carnet, nombreCompleto, activo FROM bdplaner.dbo.p_Usuarios WHERE carnet = @carnet');

    const user = result.recordset[0];
    if (!user) throw new UnauthorizedException('Usuario no encontrado en el Portal.');
    if (!user.activo) throw new UnauthorizedException('El usuario está inactivo en el Portal.');

    // Find or create local user
    const local = await pool.request()
      .input('carnet', sql.VarChar(50), carnet)
      .query('SELECT Carnet, Nombre, Rol FROM dbo.tblUsuariosAcceso WHERE Carnet = @carnet AND Activo = 1');

    let rol = 'registrador';
    if (local.recordset[0]) {
      rol = local.recordset[0].Rol;
    } else {
      await pool.request()
        .input('carnet', sql.VarChar(50), carnet)
        .input('nombre', sql.VarChar(250), user.nombreCompleto)
        .input('rol', sql.VarChar(30), 'registrador')
        .query('INSERT INTO dbo.tblUsuariosAcceso (Carnet, Nombre, Rol) VALUES (@carnet, @nombre, @rol)');
    }

    const token = this.jwt.sign({ carnet, nombre: user.nombreCompleto, rol });
    return { access_token: token, user: { carnet, nombre: user.nombreCompleto, rol } };
  }

  async me(carnet: string) {
    const pool = await this.db.getPool();
    const result = await pool.request()
      .input('carnet', sql.VarChar(50), carnet)
      .query('SELECT Carnet, Nombre, Rol FROM dbo.tblUsuariosAcceso WHERE Carnet = @carnet AND Activo = 1');
    const u = result.recordset[0];
    if (!u) return null;
    return { carnet: u.Carnet, nombre: u.Nombre, rol: u.Rol };
  }
}
