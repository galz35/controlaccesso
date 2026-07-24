import { SearchService } from './search.service';
export declare class SearchController {
    private search;
    constructor(search: SearchService);
    empleado(q: string): Promise<import("mssql").IRecordSet<any>>;
    proveedor(q: string): Promise<import("mssql").IRecordSet<any>>;
    instructor(q: string): Promise<import("mssql").IRecordSet<any>>;
    ubicaciones(): Promise<import("mssql").IRecordSet<any>>;
    personalExterno(q: string): Promise<import("mssql").IRecordSet<any>>;
    foto(carnet: string): Promise<{
        foto: string | null;
    }>;
    estado(carnet: string): Promise<{
        activo: boolean;
        cargo?: string;
        empresa?: string;
    }>;
}
