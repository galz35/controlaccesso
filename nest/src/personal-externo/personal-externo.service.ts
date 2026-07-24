import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class PersonalExternoService {
  constructor(private db: DatabaseService) {}

  async getAll() {
    const pool = await this.db.getPool();
    const result = await pool.request().execute('sp_PersonalExterno_Listar');
    return result.recordset;
  }

  async create(dto: any) {
    const pool = await this.db.getPool();
    const request = pool.request();
    Object.keys(dto).forEach(k => request.input(k, dto[k]));
    const result = await request.execute('sp_PersonalExterno_Crear');
    return result.recordset[0];
  }

  async update(id: number, dto: any) {
    const pool = await this.db.getPool();
    const request = pool.request();
    request.input('Id', id);
    Object.keys(dto).forEach(k => request.input(k, dto[k]));
    const result = await request.execute('sp_PersonalExterno_Actualizar');
    if (!result.recordset[0]) throw new NotFoundException('Registro no encontrado.');
    return result.recordset[0];
  }
}
