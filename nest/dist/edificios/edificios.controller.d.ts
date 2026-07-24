import { EdificiosService } from './edificios.service';
import { EdificioDto } from '../common/dto/catalog.dto';
export declare class EdificiosController {
    private service;
    constructor(service: EdificiosService);
    getAll(): Promise<any[]>;
    create(dto: EdificioDto): Promise<any>;
    update(id: number, dto: EdificioDto): Promise<any>;
}
