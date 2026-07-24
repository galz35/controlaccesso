import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AccesoService } from './acceso.service';
import { RegistrarEntradaDto, ReporteQueryDto, SalidaIndependienteDto } from './dto/acceso.dto';
export declare class AccesoController {
    private acceso;
    private config;
    constructor(acceso: AccesoService, config: ConfigService);
    entrada(dto: RegistrarEntradaDto, req: any, foto?: Express.Multer.File): Promise<any>;
    salida(id: number, req: any): Promise<any>;
    salidaIndependiente(dto: SalidaIndependienteDto, req: any): Promise<any>;
    hoy(raw: string, req: any): Promise<{
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
    pendientes(raw: string, req: any): Promise<{
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
        antiguedadHoras: any;
    }[]>;
    reporte(query: ReporteQueryDto, req: any): Promise<{
        data: any;
        total: any;
        pagina: number;
        porPagina: number;
    }>;
    getFoto(fileName: string, req: any, res: Response): Promise<void>;
}
