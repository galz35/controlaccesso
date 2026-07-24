import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as XLSX from 'xlsx';

const TIPOS_VALIDOS = ['EMPLEADO', 'PROVEEDOR', 'INSTRUCTOR_EXTERNO', 'INSTRUCTOR_INTERNO', 'VISITANTE', 'SERVICIO_EXTERNO'];

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

  async importarExcel(buffer: Buffer, usuario?: string) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (raw.length === 0) throw new BadRequestException('El archivo no contiene datos');

    const participantes = raw.map((row, i) => {
      const eventoCursoId = Number(row.eventoCursoId || row.EventoCursoId || row.EVENTOCURSOID);
      const tipoPersona = (row.tipoPersona || row.TipoPersona || row.TIPOPERSONA || '').toString().trim().toUpperCase();
      const personaId = (row.personaId || row.PersonaId || row.PERSONAID || row.carnet || row.Carnet || row.CARNET || '').toString().trim();
      const nombrePersona = (row.nombrePersona || row.NombrePersona || row.NOMBREPERSONA || row.nombre || row.Nombre || row.NOMBRE || '').toString().trim();
      const cedulaPersona = (row.cedulaPersona || row.CedulaPersona || row.CEDULAPERSONA || row.cedula || row.Cedula || row.CEDULA || '').toString().trim() || undefined;
      const empresaPersona = (row.empresaPersona || row.EmpresaPersona || row.EMPRESAPERSONA || row.empresa || row.Empresa || row.EMPRESA || '').toString().trim() || undefined;

      if (!eventoCursoId || isNaN(eventoCursoId)) throw new BadRequestException(`Fila ${i + 2}: eventoCursoId inválido`);
      if (!TIPOS_VALIDOS.includes(tipoPersona)) throw new BadRequestException(`Fila ${i + 2}: tipoPersona inválido: "${tipoPersona}". Use: ${TIPOS_VALIDOS.join(', ')}`);
      if (!personaId) throw new BadRequestException(`Fila ${i + 2}: personaId/carnet requerido`);
      if (!nombrePersona) throw new BadRequestException(`Fila ${i + 2}: nombrePersona requerido`);

      return { eventoCursoId, tipoPersona, personaId, nombrePersona, cedulaPersona, empresaPersona };
    });

    return this.importar(participantes, usuario);
  }

  async generarPlantilla(): Promise<Buffer> {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ['eventoCursoId', 'tipoPersona', 'carnet', 'nombrePersona', 'cedulaPersona', 'empresaPersona'],
      ['1', 'EMPLEADO', '500708', 'Ejemplo: GUSTAVO ADOLFO LIRA SALAZAR', '001-123456-7', 'CLARO NICARAGUA'],
      ['1', 'PROVEEDOR', '3', 'Ejemplo: Proveedor ABC', '001-765432-1', 'ABC S.A.'],
      ['2', 'SERVICIO_EXTERNO', 'PL001', 'Ejemplo: Juan Perez Lopez', '', 'Servicios Generales'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 14 }, { wch: 20 }, { wch: 10 }, { wch: 40 }, { wch: 16 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Participantes');
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
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
