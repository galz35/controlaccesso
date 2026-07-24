import { DatabaseService } from '../database/database.service';
export declare class CursosService {
    private db;
    constructor(db: DatabaseService);
    getAll(): Promise<any[]>;
    create(dto: any): Promise<any>;
    update(id: number, dto: any): Promise<any>;
    importar(cursos: {
        nombre: string;
        descripcion?: string;
        duracionHoras?: number;
    }[]): Promise<any>;
}
