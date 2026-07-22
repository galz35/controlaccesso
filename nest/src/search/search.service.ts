import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as sql from 'mssql';

@Injectable()
export class SearchService {
  constructor(private db: DatabaseService) {}

  async buscarEmpleado(q: string) {
    const pool = await this.db.getPool();
    const result = await pool.request()
      .input('q', sql.VarChar(100), `%${q}%`)
      .query(`
        SELECT TOP 20 carnet, nombreCompleto AS nombre, cedula, ubicacion, gerencia, activo
        FROM bdplaner.dbo.p_Usuarios
        WHERE activo = 1 AND (carnet LIKE @q OR nombreCompleto LIKE @q)
        ORDER BY nombreCompleto
      `);
    return result.recordset;
  }

  async buscarProveedor(q: string) {
    const pool = await this.db.getPool();
    const result = await pool.request()
      .input('q', sql.VarChar(100), `%${q}%`)
      .query(`
        SELECT TOP 20 Id AS id, Nombre, Cedula AS cedula, Empresa, Telefono
        FROM dbo.tblProveedores
        WHERE Activo = 1 AND (Nombre LIKE @q OR Cedula LIKE @q OR Empresa LIKE @q)
        ORDER BY Nombre
      `);
    return result.recordset;
  }

  async buscarInstructor(q: string) {
    const pool = await this.db.getPool();
    const result = await pool.request()
      .input('q', sql.VarChar(100), `%${q}%`)
      .query(`
        SELECT TOP 20 Id AS id, Nombre, Cedula AS cedula, Empresa, Telefono, Especialidad
        FROM dbo.tblInstructores
        WHERE Activo = 1 AND (Nombre LIKE @q OR Cedula LIKE @q)
        ORDER BY Nombre
      `);
    return result.recordset;
  }

  async buscarUbicaciones() {
    const pool = await this.db.getPool();
    const result = await pool.request()
      .query(`
        SELECT DISTINCT ubicacion FROM bdplaner.dbo.p_Usuarios
        WHERE ubicacion IS NOT NULL AND ubicacion != '' AND activo = 1
        ORDER BY ubicacion
      `);
    return result.recordset.map(r => ({ nombre: r.ubicacion }));
  }
}
