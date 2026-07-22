import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '@nestjs/config';
import * as sql from 'mssql';
import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AccesoService {
  constructor(
    private db: DatabaseService,
    private config: ConfigService,
  ) {}

  async registrarEntrada(
    dto: { edificioId: number; eventoCursoId?: number; tipoPersona: string; personaId: string; nombrePersona: string; cedulaPersona?: string; empresaPersona?: string },
    usuario: string,
    fotoFile?: Express.Multer.File,
  ) {
    const pool = await this.db.getPool();

    let nombreFinal = dto.nombrePersona;
    let cedulaFinal = dto.cedulaPersona || null;

    // If employee, fetch from Portal
    if (dto.tipoPersona === 'EMPLEADO' || dto.tipoPersona === 'INSTRUCTOR_INTERNO') {
      const result = await pool.request()
        .input('carnet', sql.VarChar(50), dto.personaId)
        .query('SELECT nombreCompleto, cedula FROM bdplaner.dbo.p_Usuarios WHERE carnet = @carnet AND activo = 1');
      if (result.recordset[0]) {
        nombreFinal = result.recordset[0].nombreCompleto;
        cedulaFinal = result.recordset[0].cedula || cedulaFinal;
      }
    }

    let fotoUrl: string | null = null;
    if (fotoFile) {
      fotoUrl = await this.savePhoto(fotoFile);
    }

    const request = pool.request();
    request.input('EventoCursoId', sql.Int, dto.eventoCursoId || null);
    request.input('EdificioId', sql.Int, dto.edificioId);
    request.input('TipoPersona', sql.VarChar(30), dto.tipoPersona);
    request.input('PersonaId', sql.VarChar(50), dto.personaId);
    request.input('NombrePersona', sql.VarChar(250), nombreFinal);
    request.input('CedulaPersona', sql.VarChar(50), cedulaFinal);
    request.input('EmpresaPersona', sql.VarChar(250), dto.empresaPersona || null);
    request.input('FotoUrl', sql.VarChar(500), fotoUrl);
    request.input('UsuarioRegistra', sql.VarChar(100), usuario);

    const result = await request.query(`
      INSERT INTO dbo.tblRegistroAcceso (EventoCursoId, EdificioId, TipoPersona, PersonaId, NombrePersona, CedulaPersona, EmpresaPersona, FotoUrl, UsuarioRegistra)
      OUTPUT INSERTED.*
      VALUES (@EventoCursoId, @EdificioId, @TipoPersona, @PersonaId, @NombrePersona, @CedulaPersona, @EmpresaPersona, @FotoUrl, @UsuarioRegistra)
    `);

    const r = result.recordset[0];
    return {
      id: r.Id, tipoPersona: r.TipoPersona, personaId: r.PersonaId,
      nombre: r.NombrePersona, fechaEntrada: r.FechaEntrada,
      fotoUrl: r.FotoUrl, edificioId: r.EdificioId,
    };
  }

  async registrarSalida(id: number) {
    const pool = await this.db.getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE dbo.tblRegistroAcceso
        SET FechaSalida = GETDATE()
        OUTPUT INSERTED.*
        WHERE Id = @id AND FechaSalida IS NULL
      `);
    if (!result.recordset[0]) throw new NotFoundException('Registro no encontrado o ya tiene salida registrada.');
    const r = result.recordset[0];
    return { id: r.Id, fechaSalida: r.FechaSalida };
  }

  async accesosHoy(edificioId?: number) {
    const pool = await this.db.getPool();
    let where = 'WHERE CAST(FechaEntrada AS DATE) = CAST(GETDATE() AS DATE)';
    if (edificioId) {
      where += ' AND EdificioId = @edificioId';
    }
    const request = pool.request();
    if (edificioId) request.input('edificioId', sql.Int, edificioId);
    const result = await request.query(`
      SELECT r.*, e.Nombre AS EdificioNombre
      FROM dbo.tblRegistroAcceso r
      INNER JOIN dbo.tblEdificios e ON r.EdificioId = e.Id
      ${where}
      ORDER BY r.FechaEntrada DESC
    `);
    return result.recordset.map(r => ({
      id: r.Id, tipoPersona: r.TipoPersona, personaId: r.PersonaId,
      nombre: r.NombrePersona, cedula: r.CedulaPersona, empresa: r.EmpresaPersona,
      edificio: r.EdificioNombre, fotoUrl: r.FotoUrl,
      fechaEntrada: r.FechaEntrada, fechaSalida: r.FechaSalida,
      usuarioRegistra: r.UsuarioRegistra,
    }));
  }

  async reporte(eventoId?: number, edificioId?: number, tipoPersona?: string, desde?: string, hasta?: string, pagina = 1, porPagina = 50) {
    const pool = await this.db.getPool();
    const conditions: string[] = [];
    const request = pool.request();

    if (edificioId) { conditions.push('r.EdificioId = @edificioId'); request.input('edificioId', sql.Int, edificioId); }
    if (tipoPersona) { conditions.push('r.TipoPersona = @tipoPersona'); request.input('tipoPersona', sql.VarChar(30), tipoPersona); }
    if (desde) { conditions.push('r.FechaEntrada >= @desde'); request.input('desde', sql.DateTime2(0), new Date(desde)); }
    if (hasta) { conditions.push('r.FechaEntrada <= @hasta'); request.input('hasta', sql.DateTime2(0), new Date(hasta)); }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const offset = (pagina - 1) * porPagina;

    const countResult = await request.query(`SELECT COUNT(*) AS total FROM dbo.tblRegistroAcceso r ${where}`);
    const total = countResult.recordset[0]?.total || 0;

    const dataResult = await request.query(`
      SELECT r.*, e.Nombre AS EdificioNombre
      FROM dbo.tblRegistroAcceso r
      INNER JOIN dbo.tblEdificios e ON r.EdificioId = e.Id
      ${where}
      ORDER BY r.FechaEntrada DESC
      OFFSET ${offset} ROWS FETCH NEXT ${porPagina} ROWS ONLY
    `);

    return {
      data: dataResult.recordset.map(r => ({
        id: r.Id, tipoPersona: r.TipoPersona, personaId: r.PersonaId,
        nombre: r.NombrePersona, cedula: r.CedulaPersona, empresa: r.EmpresaPersona,
        edificio: r.EdificioNombre, fotoUrl: r.FotoUrl,
        fechaEntrada: r.FechaEntrada, fechaSalida: r.FechaSalida,
        usuarioRegistra: r.UsuarioRegistra,
      })),
      total, pagina, porPagina,
    };
  }

  private async savePhoto(file: Express.Multer.File): Promise<string> {
    const uploadPath = this.config.get<string>('UPLOAD_PATH', './uploads');
    const dir = path.join(uploadPath, 'fotos_acceso');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const fileName = `${uuidv4()}.webp`;
    const filePath = path.join(dir, fileName);
    await sharp(file.buffer).resize({ width: 800, withoutEnlargement: true }).webp({ quality: 70 }).toFile(filePath);
    return `/control-acceso-uploads/fotos_acceso/${fileName}`;
  }
}
