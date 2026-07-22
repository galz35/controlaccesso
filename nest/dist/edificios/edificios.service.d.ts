import { DatabaseService } from '../database/database.service';
import * as sql from 'mssql';
export declare class EdificiosService {
    private db;
    constructor(db: DatabaseService);
    getAll(): Promise<sql.IRecordSet<any>>;
    create(dto: any): Promise<any>;
    update(id: number, dto: any): Promise<any>;
}
