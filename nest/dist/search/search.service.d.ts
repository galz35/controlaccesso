import { DatabaseService } from '../database/database.service';
import { HcmService } from '../integration/hcm.service';
export declare class SearchService {
    private db;
    private hcm;
    constructor(db: DatabaseService, hcm: HcmService);
    buscarEmpleado(q: string): Promise<import("mssql").IRecordSet<any>>;
    buscarProveedor(q: string): Promise<import("mssql").IRecordSet<any>>;
    buscarInstructor(q: string): Promise<import("mssql").IRecordSet<any>>;
    buscarUbicaciones(): Promise<import("mssql").IRecordSet<any>>;
    buscarPersonalExterno(q: string): Promise<import("mssql").IRecordSet<any>>;
    obtenerFoto(carnet: string): Promise<{
        foto: string | null;
    }>;
}
