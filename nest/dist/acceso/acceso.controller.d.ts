import { AccesoService } from './acceso.service';
import { RegistrarEntradaDto, ReporteQueryDto, SalidaIndependienteDto } from './dto/acceso.dto';
export declare class AccesoController {
    private acceso;
    constructor(acceso: AccesoService);
    entrada(dto: RegistrarEntradaDto, req: any, foto?: Express.Multer.File): Promise<any>;
    salida(id: number): Promise<any>;
    salidaIndependiente(dto: SalidaIndependienteDto, req: any): Promise<any>;
    hoy(edificioId?: string): Promise<{
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
    pendientes(edificioId?: string): Promise<{
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
    reporte(query: ReporteQueryDto): Promise<{
        data: any;
        total: any;
        pagina: number;
        porPagina: number;
    }>;
}
