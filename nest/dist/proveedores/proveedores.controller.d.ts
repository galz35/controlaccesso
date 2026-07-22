import { ProveedoresService } from './proveedores.service';
export declare class ProveedoresController {
    private service;
    constructor(service: ProveedoresService);
    getAll(): Promise<any[]>;
    create(dto: any): Promise<any>;
    update(id: number, dto: any): Promise<any>;
}
