import { EdificiosService } from './edificios.service';
export declare class EdificiosController {
    private service;
    constructor(service: EdificiosService);
    getAll(): Promise<import("mssql").IRecordSet<any>>;
    create(dto: any): Promise<any>;
    update(id: number, dto: any): Promise<any>;
}
