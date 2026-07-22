import { DatabaseService } from '../database/database.service';
export declare class SearchService {
    private db;
    constructor(db: DatabaseService);
    buscarEmpleado(q: string): Promise<import("mssql").IRecordSet<any>>;
    buscarProveedor(q: string): Promise<import("mssql").IRecordSet<any>>;
    buscarInstructor(q: string): Promise<import("mssql").IRecordSet<any>>;
    buscarUbicaciones(): Promise<import("mssql").IRecordSet<any>>;
}
