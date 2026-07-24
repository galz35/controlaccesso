"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccesoService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const config_1 = require("@nestjs/config");
const path = require("path");
const fs = require("fs");
const sharp_1 = require("sharp");
const uuid_1 = require("uuid");
let AccesoService = class AccesoService {
    constructor(db, config) {
        this.db = db;
        this.config = config;
    }
    async registrarEntrada(dto, usuario, fotoFile) {
        const pool = await this.db.getPool();
        let fotoUrl = null;
        if (fotoFile)
            fotoUrl = await this.savePhoto(fotoFile);
        const result = await pool.request()
            .input('EventoCursoId', dto.eventoCursoId || null)
            .input('EdificioId', dto.edificioId)
            .input('TipoPersona', dto.tipoPersona)
            .input('PersonaId', dto.personaId)
            .input('NombrePersona', dto.nombrePersona)
            .input('CedulaPersona', dto.cedulaPersona || null)
            .input('EmpresaPersona', dto.empresaPersona || null)
            .input('FotoUrl', fotoUrl)
            .input('UsuarioRegistra', usuario)
            .input('MotivoAcceso', dto.motivoAcceso)
            .input('MotivoDetalle', dto.motivoDetalle || null)
            .execute('sp_Acceso_RegistrarEntrada');
        return result.recordset[0];
    }
    async registrarSalida(id) {
        const pool = await this.db.getPool();
        try {
            const result = await pool.request()
                .input('Id', id)
                .execute('sp_Acceso_RegistrarSalida');
            return result.recordset[0];
        }
        catch (err) {
            console.error('Salida error:', err.number, err.message?.substring(0, 100));
            if (err.number === 51000 || err.message?.includes('51000'))
                throw new common_1.NotFoundException(err.message);
            throw err;
        }
    }
    async accesosHoy(edificioId) {
        const pool = await this.db.getPool();
        const request = pool.request();
        request.input('EdificioId', edificioId || null);
        const result = await request.execute('sp_Acceso_Hoy');
        return result.recordset.map(r => ({
            id: r.Id, tipoPersona: r.TipoPersona, personaId: r.PersonaId,
            nombre: r.NombrePersona, cedula: r.CedulaPersona, empresa: r.EmpresaPersona,
            edificio: r.EdificioNombre, fotoUrl: r.FotoUrl,
            fechaEntrada: r.FechaEntrada, fechaSalida: r.FechaSalida,
            usuarioRegistra: r.UsuarioRegistra, motivoAcceso: r.MotivoAcceso, motivoDetalle: r.MotivoDetalle,
        }));
    }
    async accesosPendientes(edificioId) {
        const pool = await this.db.getPool();
        const request = pool.request();
        request.input('EdificioId', edificioId || null);
        const result = await request.execute('sp_Acceso_Pendientes');
        return result.recordset.map(r => ({
            id: r.Id, tipoPersona: r.TipoPersona, personaId: r.PersonaId,
            nombre: r.NombrePersona, cedula: r.CedulaPersona, empresa: r.EmpresaPersona,
            edificio: r.EdificioNombre, fotoUrl: r.FotoUrl,
            fechaEntrada: r.FechaEntrada, fechaSalida: r.FechaSalida,
            usuarioRegistra: r.UsuarioRegistra, motivoAcceso: r.MotivoAcceso, motivoDetalle: r.MotivoDetalle,
            antiguedadHoras: r.AntiguedadHoras,
        }));
    }
    async registrarSalidaIndependiente(dto, usuario) {
        const pool = await this.db.getPool();
        const result = await pool.request()
            .input('EdificioId', dto.edificioId)
            .input('TipoPersona', 'SALIDA_INDEPENDIENTE')
            .input('PersonaId', dto.personaId)
            .input('NombrePersona', dto.nombrePersona)
            .input('UsuarioRegistra', usuario)
            .input('Observacion', dto.observacion)
            .execute('sp_Acceso_SalidaIndependiente');
        return { ...result.recordset[0], tipo: 'SALIDA_NOCTROL' };
    }
    async reporte(edificioId, tipoPersona, desde, hasta, pagina = 1, porPagina = 50, motivoAcceso) {
        const pool = await this.db.getPool();
        const result = await pool.request()
            .input('Pagina', pagina)
            .input('PorPagina', porPagina)
            .input('EdificioId', edificioId || null)
            .input('TipoPersona', tipoPersona || null)
            .input('Desde', desde ? new Date(desde) : null)
            .input('Hasta', hasta ? new Date(hasta) : null)
            .input('MotivoAcceso', motivoAcceso || null)
            .execute('sp_Acceso_Reporte');
        const total = result.recordsets[0][0]?.Total || 0;
        return {
            data: result.recordsets[1].map(r => ({
                id: r.Id, tipoPersona: r.TipoPersona, personaId: r.PersonaId,
                nombre: r.NombrePersona, cedula: r.CedulaPersona, empresa: r.EmpresaPersona,
                edificio: r.EdificioNombre, fotoUrl: r.FotoUrl,
                fechaEntrada: r.FechaEntrada, fechaSalida: r.FechaSalida,
                usuarioRegistra: r.UsuarioRegistra, motivoAcceso: r.MotivoAcceso, motivoDetalle: r.MotivoDetalle,
            })),
            total, pagina, porPagina,
        };
    }
    async savePhoto(file) {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedMimes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('Formato de foto no permitido. Use JPG, PNG, WebP o GIF.');
        }
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new common_1.BadRequestException('La foto excede 5MB.');
        }
        const uploadPath = this.config.get('UPLOAD_PATH', './uploads');
        const dir = path.join(uploadPath, 'fotos_acceso');
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
        const fileName = `${(0, uuid_1.v4)()}.webp`;
        const filePath = path.join(dir, fileName);
        await (0, sharp_1.default)(file.buffer).resize({ width: 800, withoutEnlargement: true }).webp({ quality: 70 }).toFile(filePath);
        return `/control-acceso-uploads/fotos_acceso/${fileName}`;
    }
};
exports.AccesoService = AccesoService;
exports.AccesoService = AccesoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        config_1.ConfigService])
], AccesoService);
//# sourceMappingURL=acceso.service.js.map