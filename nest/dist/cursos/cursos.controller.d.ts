import { CursosService } from './cursos.service';
import { CursoDto } from '../common/dto/catalog.dto';
import { ImportarCursosDto } from './dto/importar-cursos.dto';
export declare class CursosController {
    private service;
    constructor(service: CursosService);
    getAll(): Promise<any[]>;
    create(dto: CursoDto): Promise<any>;
    importar(dto: ImportarCursosDto): Promise<any>;
    update(id: number, dto: CursoDto): Promise<any>;
}
