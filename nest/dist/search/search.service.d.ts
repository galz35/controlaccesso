import { DatabaseService } from '../database/database.service';
import * as sql from 'mssql';
export declare class SearchService {
    private db;
    constructor(db: DatabaseService);
    buscarEmpleado(q: string): Promise<sql.IRecordSet<any>>;
    buscarProveedor(q: string): Promise<sql.IRecordSet<any>>;
    buscarInstructor(q: string): Promise<sql.IRecordSet<any>>;
    buscarUbicaciones(): Promise<{
        nombre: any;
    }[]>;
}
