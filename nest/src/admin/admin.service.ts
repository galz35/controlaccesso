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

  async deactivateCpf(username: string) {
    if (!username) throw new BadRequestException('Username requerido');
    const pool = await this.db.getPool();
    try {
      const result = await pool.request()
        .input('Username', username)
        .execute('sp_UsuarioCPF_Desactivar');
      return result.recordset[0];
    } catch (err: any) {
      if (err.number === 51000 || err.message?.includes('51000'))
        throw new NotFoundException(err.message);
      throw err;
    }
  }

  async activateCpf(username: string) {
    if (!username) throw new BadRequestException('Username requerido');
    const pool = await this.db.getPool();
    try {
      const result = await pool.request()
        .input('Username', username)
        .execute('sp_UsuarioCPF_Activar');
      return result.recordset[0];
    } catch (err: any) {
      if (err.number === 51000 || err.message?.includes('51000'))
        throw new NotFoundException(err.message);
      throw err;
    }
  }

  async changeBuilding(username: string, edificioIdDefecto?: number) {
    if (!username) throw new BadRequestException('Username requerido');
    const pool = await this.db.getPool();
    try {
      const result = await pool.request()
        .input('Username', username)
        .input('EdificioIdDefecto', edificioIdDefecto || null)
        .execute('sp_UsuarioCPF_CambiarEdificioDefecto');
      return result.recordset[0];
    } catch (err: any) {
      if (err.number === 51000 || err.message?.includes('51000'))
        throw new NotFoundException(err.message);
      throw err;
    }
  }
}