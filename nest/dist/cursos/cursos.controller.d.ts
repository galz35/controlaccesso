import { CursosService } from './cursos.service';
import { CursoDto } from '../common/dto/catalog.dto';
export declare class CursosController {
    private service;
    constructor(service: CursosService);
    getAll(): Promise<any[]>;
    create(dto: CursoDto): Promise<any>;
    update(id: number, dto: CursoDto): Promise<any>;
}
