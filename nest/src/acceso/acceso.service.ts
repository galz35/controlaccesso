import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '@nestjs/config';
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

    let fotoUrl: string | null = null;
    if (fotoFile) fotoUrl = await this.savePhoto(fotoFile);

    const result = await pool.request()
      .input('EventoCursoId', dto.eventoCursoId || null)
      .input('EdificioId', dto.edificioId)
      .input('TipoPersona', dto.tipoPersona)
      .input('PersonaId', dto.personaId)
      .input('NombrePersona', dto.nombrePersona)
      .input('CedulaPersona', dto.cedulaPersona || null)
      .input('EmpresaPersona', dto.empresaPersona || null)
      .input('FotoUrl', fotoUrl)
      .input('UsuarioRegistra', usuario)
      .execute('sp_Acceso_RegistrarEntrada');

    return result.recordset[0];
  }

  async registrarSalida(id: number) {
    const pool = await this.db.getPool();
    try {
      const result = await pool.request()
        .input('Id', id)
        .execute('sp_Acceso_RegistrarSalida');
      return result.recordset[0];
    } catch (err: any) {
      if (err.message?.includes('51000')) throw new NotFoundException(err.message);
      throw err;
    }
  }

  async accesosHoy(edificioId?: number) {
    const pool = await this.db.getPool();
    const request = pool.request();
    request.input('EdificioId', edificioId || null);
    const result = await request.execute('sp_Acceso_Hoy');
    return result.recordset.map(r => ({
      id: r.Id, tipoPersona: r.TipoPersona, personaId: r.PersonaId,
      nombre: r.NombrePersona, cedula: r.CedulaPersona, empresa: r.EmpresaPersona,
      edificio: r.EdificioNombre, fotoUrl: r.FotoUrl,
      fechaEntrada: r.FechaEntrada, fechaSalida: r.FechaSalida,
      usuarioRegistra: r.UsuarioRegistra,
    }));
  }

  async reporte(edificioId?: number, tipoPersona?: string, desde?: string, hasta?: string, pagina = 1, porPagina = 50) {
    const pool = await this.db.getPool();
    const result = await pool.request()
      .input('Pagina', pagina)
      .input('PorPagina', porPagina)
      .input('EdificioId', edificioId || null)
      .input('TipoPersona', tipoPersona || null)
      .input('Desde', desde ? new Date(desde) : null)
      .input('Hasta', hasta ? new Date(hasta) : null)
      .execute('sp_Acceso_Reporte');

    const total = result.recordsets[0][0]?.Total || 0;
    return {
      data: result.recordsets[1].map(r => ({
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
