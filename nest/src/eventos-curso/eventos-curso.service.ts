import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as sql from 'mssql';

@Injectable()
export class EventosCursoService {
  constructor(private db: DatabaseService) {}

  async getAll() {
    const pool = await this.db.getPool();
    const result = await pool.request().query(`
      SELECT e.*, c.Nombre AS CursoNombre, ed.Nombre AS EdificioNombre
      FROM dbo.tblEventosCurso e
      INNER JOIN dbo.tblCursos c ON e.CursoId = c.Id
      INNER JOIN dbo.tblEdificios ed ON e.EdificioId = ed.Id
      WHERE e.Activo = 1
      ORDER BY e.FechaInicio DESC
    `);
    return result.recordset;
  }

  async create(dto: any) {
    const pool = await this.db.getPool();
    const request = pool.request();
    request.input('CursoId', sql.Int, dto.cursoId);
    request.input('EdificioId', sql.Int, dto.edificioId);
    request.input('FechaInicio', sql.DateTime2(0), new Date(dto.fechaInicio));
    request.input('FechaFin', sql.DateTime2(0), dto.fechaFin ? new Date(dto.fechaFin) : null);
    request.input('Observaciones', sql.VarChar(500), dto.observaciones || null);
    const result = await request.query(`
      INSERT INTO dbo.tblEventosCurso (CursoId, EdificioId, FechaInicio, FechaFin, Observaciones)
      OUTPUT INSERTED.*
      VALUES (@CursoId, @EdificioId, @FechaInicio, @FechaFin, @Observaciones)
    `);
    return result.recordset[0];
  }

  async update(id: number, dto: any) {
    const pool = await this.db.getPool();
    const request = pool.request();
    request.input('id', sql.Int, id);
    if (dto.cursoId !== undefined) { request.input('CursoId', sql.Int, dto.cursoId); }
    if (dto.edificioId !== undefined) { request.input('EdificioId', sql.Int, dto.edificioId); }
    if (dto.fechaInicio !== undefined) { request.input('FechaInicio', sql.DateTime2(0), new Date(dto.fechaInicio)); }
    if (dto.fechaFin !== undefined) { request.input('FechaFin', sql.DateTime2(0), new Date(dto.fechaFin)); }
    if (dto.observaciones !== undefined) { request.input('Observaciones', sql.VarChar(500), dto.observaciones); }

    const sets: string[] = [];
    if (dto.cursoId !== undefined) sets.push('CursoId = @CursoId');
    if (dto.edificioId !== undefined) sets.push('EdificioId = @EdificioId');
    if (dto.fechaInicio !== undefined) sets.push('FechaInicio = @FechaInicio');
    if (dto.fechaFin !== undefined) sets.push('FechaFin = @FechaFin');
    if (dto.observaciones !== undefined) sets.push('Observaciones = @Observaciones');

    const result = await request.query(`UPDATE dbo.tblEventosCurso SET ${sets.join(', ')} OUTPUT INSERTED.* WHERE Id = @id`);
    if (!result.recordset[0]) throw new NotFoundException('Registro no encontrado.');
    return result.recordset[0];
  }
}
