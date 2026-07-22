import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sql from 'mssql';
export declare class DatabaseService implements OnModuleDestroy {
    private config;
    private pool;
    constructor(config: ConfigService);
    getPool(): Promise<sql.ConnectionPool>;
    onModuleDestroy(): Promise<void>;
}
