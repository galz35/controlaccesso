import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sql from 'mssql';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private pool: sql.ConnectionPool | null = null;

  constructor(private config: ConfigService) {}

  async getPool(): Promise<sql.ConnectionPool> {
    if (this.pool?.connected) return this.pool;
    this.pool = await sql.connect({
      server: this.config.get<string>('DB_SERVER', 'localhost'),
      port: parseInt(this.config.get<string>('DB_PORT', '1433'), 10),
      user: this.config.get<string>('DB_USER', 'sa'),
      password: this.config.get<string>('DB_PASSWORD'),
      database: 'ControlAcceso',
      options: { encrypt: false, trustServerCertificate: true },
    });
    return this.pool;
  }

  async onModuleDestroy() {
    try { await this.pool?.close(); } catch { /* ignore */ }
  }
}
