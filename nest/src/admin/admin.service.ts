import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AdminService {
  constructor(private db: DatabaseService) {}

  async getCpfUsers() {
    const pool = await this.db.getPool();
    const result = await pool.request().execute('sp_Admin_ListarCPF');
    return result.recordset;
  }
}
