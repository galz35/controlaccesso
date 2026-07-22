import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as sql from 'mssql';

@Injectable()
export class ProveedoresService {
  constructor(private db: DatabaseService) {}

  async getAll() {
    const pool = await this.db.getPool();
    const result = await pool.request().query(`SELECT * FROM dbo.tblProveedores WHERE Activo = 1 ORDER BY Nombre`);
    return result.recordset;
  }

  async create(dto: any) {
    const pool = await this.db.getPool();
    const keys = Object.keys(dto);
    const cols = keys.map(k => k.charAt(0).toUpperCase() + k.slice(1));
    const params = keys.map(k => '@' + k);
    const request = pool.request();
    keys.forEach(k => {
      const val = dto[k] !== undefined ? dto[k] : null;
      request.input(k, sql.VarChar(250), val);
    });
    const result = await request.query(`INSERT INTO dbo.tblProveedores (${cols.join(', ')}) OUTPUT INSERTED.* VALUES (${params.join(', ')})`);
    return result.recordset[0];
  }

  async update(id: number, dto: any) {
    const pool = await this.db.getPool();
    const keys = Object.keys(dto);
    const sets = keys.map(k => k.charAt(0).toUpperCase() + k.slice(1) + ' = @' + k);
    const request = pool.request();
    request.input('id', sql.Int, id);
    keys.forEach(k => {
      const val = dto[k] !== undefined ? dto[k] : null;
      request.input(k, sql.VarChar(250), val);
    });
    const result = await request.query(`UPDATE dbo.tblProveedores SET ${sets.join(', ')} OUTPUT INSERTED.* WHERE Id = @id`);
    if (!result.recordset[0]) throw new NotFoundException('Registro no encontrado.');
    return result.recordset[0];
  }
}
