import { CursosService } from './cursos.service';
export declare class CursosController {
    private service;
    constructor(service: CursosService);
    getAll(): Promise<import("mssql").IRecordSet<any>>;
    create(dto: any): Promise<any>;
    update(id: number, dto: any): Promise<any>;
}
