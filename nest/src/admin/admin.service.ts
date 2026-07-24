import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AdminService {
  constructor(private db: DatabaseService) {}

  async getCpfUsers() {
    const pool = await this.db.getPool();
    const result = await pool.request().execute('sp_UsuarioCPF_Listar');
    return result.recordset;
  }

  private async auditar(accion: string, usuario: string, detalle?: string, ip?: string) {
    try {
      const pool = await this.db.getPool();
      await pool.request()
        .input('Accion', accion)
        .input('Usuario', usuario)
        .input('Detalle', detalle || null)
        .input('IP', ip || null)
        .execute('sp_Auditoria_Registrar');
    } catch { /* silencioso */ }
  }

  async deactivateCpf(username: string, actor?: string, ip?: string) {
    if (!username) throw new BadRequestException('Username requerido');
    const pool = await this.db.getPool();
    let result: any;
    try {
      result = await pool.request()
        .input('Username', username)
        .execute('sp_UsuarioCPF_Desactivar');
    } catch (err: any) {
      if (err.number === 51000 || err.message?.includes('51000'))
        throw new NotFoundException(err.message);
      throw err;
    }
    this.auditar('DESACTIVAR_CPF', actor || 'admin', `Usuario: ${username}`, ip);
    return result.recordset[0];
  }

  async activateCpf(username: string, actor?: string, ip?: string) {
    if (!username) throw new BadRequestException('Username requerido');
    const pool = await this.db.getPool();
    let result: any;
    try {
      result = await pool.request()
        .input('Username', username)
        .execute('sp_UsuarioCPF_Activar');
    } catch (err: any) {
      if (err.number === 51000 || err.message?.includes('51000'))
        throw new NotFoundException(err.message);
      throw err;
    }
    this.auditar('ACTIVAR_CPF', actor || 'admin', `Usuario: ${username}`, ip);
    return result.recordset[0];
  }

  async changeBuilding(username: string, edificioIdDefecto?: number, actor?: string, ip?: string) {
    if (!username) throw new BadRequestException('Username requerido');
    const pool = await this.db.getPool();
    let result: any;
    try {
      result = await pool.request()
        .input('Username', username)
        .input('EdificioIdDefecto', edificioIdDefecto || null)
        .execute('sp_UsuarioCPF_CambiarEdificioDefecto');
    } catch (err: any) {
      if (err.number === 51000 || err.message?.includes('51000'))
        throw new NotFoundException(err.message);
      throw err;
    }
    this.auditar('CAMBIAR_EDIFICIO_CPF', actor || 'admin',
      `Usuario: ${username}, EdificioId: ${edificioIdDefecto || 'ninguno'}`, ip);
    return result.recordset[0];
  }
}