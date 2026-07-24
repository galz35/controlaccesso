import { ProveedoresService } from './proveedores.service';
import { ProveedorDto } from '../common/dto/catalog.dto';
export declare class ProveedoresController {
    private service;
    constructor(service: ProveedoresService);
    getAll(): Promise<any[]>;
    create(dto: ProveedorDto): Promise<any>;
    update(id: number, dto: ProveedorDto): Promise<any>;
}
