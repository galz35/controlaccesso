import { EventosCursoService } from './eventos-curso.service';
export declare class EventosCursoController {
    private service;
    constructor(service: EventosCursoService);
    getAll(): Promise<any[]>;
    create(dto: any): Promise<any>;
    update(id: number, dto: any): Promise<any>;
}
