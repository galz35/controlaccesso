import { DatabaseService } from '../database/database.service';
import { ConfigService } from '@nestjs/config';
export declare class AccesoService {
    private db;
    private config;
    constructor(db: DatabaseService, config: ConfigService);
    registrarEntrada(dto: {
        edificioId: number;
        eventoCursoId?: number;
        tipoPersona: string;
        personaId: string;
        nombrePersona: string;
        cedulaPersona?: string;
        empresaPersona?: string;
        motivoAcceso?: string;
        motivoDetalle?: string;
    }, usuario: string, fotoFile?: Express.Multer.File): Promise<any>;
    registrarSalida(id: number): Promise<any>;
    accesosHoy(edificioId?: number): Promise<{
        id: any;
        tipoPersona: any;
        personaId: any;
        nombre: any;
        cedula: any;
        empresa: any;
        edificio: any;
        fotoUrl: any;
        fechaEntrada: any;
        fechaSalida: any;
        usuarioRegistra: any;
        motivoAcceso: any;
        motivoDetalle: any;
    }[]>;
    reporte(edificioId?: number, tipoPersona?: string, desde?: string, hasta?: string, pagina?: number, porPagina?: number): Promise<{
        data: any;
        total: any;
        pagina: number;
        porPagina: number;
    }>;
    private savePhoto;
}
