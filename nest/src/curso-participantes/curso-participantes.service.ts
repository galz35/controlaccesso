import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CursoParticipantesService {
  constructor(private db: DatabaseService) {}

  async importar(participantes: any[], usuario?: string) {
    const pool = await this.db.getPool();
    const result = await pool.request()
      .input('ParticipantesJSON', JSON.stringify(participantes))
      .input('UsuarioRegistra', usuario || null)
      .execute('sp_CursoParticipantes_Importar');
    return { importados: result.recordset.length, participantes: result.recordset };
  }

  async listarPorPersona(tipoPersona: string, personaId: string) {
    const pool = await this.db.getPool();
    const result = await pool.request()
      .input('TipoPersona', tipoPersona)
      .input('PersonaId', personaId)
      .execute('sp_CursoParticipantes_ListarPorPersona');
    return result.recordset;
  }

  async listarPorCurso(cursoId: number) {
    const pool = await this.db.getPool();
    const result = await pool.request()
      .input('CursoId', cursoId)
      .execute('sp_CursoParticipantes_ListarConDetalle');
    return result.recordset;
  }
}
