import { EventosCursoService } from './eventos-curso.service';
import { EventoCursoDto } from '../common/dto/catalog.dto';
export declare class EventosCursoController {
    private service;
    constructor(service: EventosCursoService);
    getAll(edificioId?: string): Promise<any[]>;
    create(dto: EventoCursoDto): Promise<any>;
    update(id: number, dto: EventoCursoDto): Promise<any>;
}
