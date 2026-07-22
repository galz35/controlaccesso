import { ProveedoresService } from './proveedores.service';
export declare class ProveedoresController {
    private service;
    constructor(service: ProveedoresService);
    getAll(): Promise<import("mssql").IRecordSet<any>>;
    create(dto: any): Promise<any>;
    update(id: number, dto: any): Promise<any>;
}
