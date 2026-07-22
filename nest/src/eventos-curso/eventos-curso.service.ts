import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class EventosCursoService {
  constructor(private db: DatabaseService) {}

  async getAll(): Promise<any[]> {
    const pool = await this.db.getPool();
    const result = await pool.request().execute('sp_EventosCurso_Listar');
    return result.recordset;
  }

  async create(dto: any): Promise<any> {
    const pool = await this.db.getPool();
    const request = pool.request();
    request.input('CursoId', dto.cursoId);
    request.input('EdificioId', dto.edificioId);
    request.input('FechaInicio', new Date(dto.fechaInicio));
    request.input('FechaFin', dto.fechaFin ? new Date(dto.fechaFin) : null);
    request.input('Observaciones', dto.observaciones || null);
    const result = await request.execute('sp_EventosCurso_Crear');
    return result.recordset[0];
  }

  async update(id: number, dto: any): Promise<any> {
    const pool = await this.db.getPool();
    const request = pool.request();
    request.input('Id', id);
    if (dto.cursoId !== undefined) request.input('CursoId', dto.cursoId);
    if (dto.edificioId !== undefined) request.input('EdificioId', dto.edificioId);
    if (dto.fechaInicio !== undefined) request.input('FechaInicio', new Date(dto.fechaInicio));
    if (dto.fechaFin !== undefined) request.input('FechaFin', new Date(dto.fechaFin));
    if (dto.observaciones !== undefined) request.input('Observaciones', dto.observaciones);
    const result = await request.execute('sp_EventosCurso_Actualizar');
    if (!result.recordset[0]) throw new NotFoundException('Registro no encontrado.');
    return result.recordset[0];
  }
}
