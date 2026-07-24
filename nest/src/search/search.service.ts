import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { HcmService } from '../integration/hcm.service';

@Injectable()
export class SearchService {
  constructor(
    private db: DatabaseService,
    private hcm: HcmService,
  ) {}

  async buscarEmpleado(q: string) {
    const pool = await this.db.getPool();
    const result = await pool.request()
      .input('Query', q)
      .execute('sp_Buscar_Empleado');
    return result.recordset;
  }

  async buscarProveedor(q: string) {
    const pool = await this.db.getPool();
    const result = await pool.request()
      .input('Query', q)
      .execute('sp_Buscar_Proveedor');
    return result.recordset;
  }

  async buscarInstructor(q: string) {
    const pool = await this.db.getPool();
    const result = await pool.request()
      .input('Query', q)
      .execute('sp_Buscar_Instructor');
    return result.recordset;
  }

  async buscarUbicaciones() {
    const pool = await this.db.getPool();
    const result = await pool.request().execute('sp_Buscar_Ubicaciones');
    return result.recordset;
  }

  async buscarPersonalExterno(q: string) {
    const pool = await this.db.getPool();
    const result = await pool.request()
      .input('Query', q)
      .execute('sp_Buscar_PersonalExterno');
    return result.recordset;
  }

  async obtenerFoto(carnet: string): Promise<{ foto: string | null }> {
    const foto = await this.hcm.obtenerFotoEmpleado(carnet);
    return { foto };
  }
}
