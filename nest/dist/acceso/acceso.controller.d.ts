import { AccesoService } from './acceso.service';
export declare class AccesoController {
    private acceso;
    constructor(acceso: AccesoService);
    entrada(dto: any, req: any, foto?: Express.Multer.File): Promise<{
        id: any;
        tipoPersona: any;
        personaId: any;
        nombre: any;
        fechaEntrada: any;
        fotoUrl: any;
        edificioId: any;
    }>;
    salida(id: number): Promise<{
        id: any;
        fechaSalida: any;
    }>;
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
    }[]>;
    reporte(edificioId?: string, tipoPersona?: string, desde?: string, hasta?: string, pagina?: string, porPagina?: string): Promise<{
        data: {
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
        }[];
        total: any;
        pagina: number;
        porPagina: number;
    }>;
}
