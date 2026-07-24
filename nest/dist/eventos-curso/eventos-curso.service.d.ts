import { DatabaseService } from '../database/database.service';
export declare class EventosCursoService {
    private db;
    constructor(db: DatabaseService);
    getAll(edificioId?: number): Promise<any[]>;
    create(dto: any): Promise<any>;
    update(id: number, dto: any): Promise<any>;
}
