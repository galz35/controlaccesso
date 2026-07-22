import { SearchService } from './search.service';
export declare class SearchController {
    private search;
    constructor(search: SearchService);
    empleado(q: string): Promise<import("mssql").IRecordSet<any>>;
    proveedor(q: string): Promise<import("mssql").IRecordSet<any>>;
    instructor(q: string): Promise<import("mssql").IRecordSet<any>>;
    ubicaciones(): Promise<{
        nombre: any;
    }[]>;
}
