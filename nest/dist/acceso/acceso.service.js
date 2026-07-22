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
const sql = require("mssql");
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
        let nombreFinal = dto.nombrePersona;
        let cedulaFinal = dto.cedulaPersona || null;
        if (dto.tipoPersona === 'EMPLEADO' || dto.tipoPersona === 'INSTRUCTOR_INTERNO') {
            const result = await pool.request()
                .input('carnet', sql.VarChar(50), dto.personaId)
                .query('SELECT nombreCompleto, cedula FROM bdplaner.dbo.p_Usuarios WHERE carnet = @carnet AND activo = 1');
            if (result.recordset[0]) {
                nombreFinal = result.recordset[0].nombreCompleto;
                cedulaFinal = result.recordset[0].cedula || cedulaFinal;
            }
        }
        let fotoUrl = null;
        if (fotoFile) {
            fotoUrl = await this.savePhoto(fotoFile);
        }
        const request = pool.request();
        request.input('EventoCursoId', sql.Int, dto.eventoCursoId || null);
        request.input('EdificioId', sql.Int, dto.edificioId);
        request.input('TipoPersona', sql.VarChar(30), dto.tipoPersona);
        request.input('PersonaId', sql.VarChar(50), dto.personaId);
        request.input('NombrePersona', sql.VarChar(250), nombreFinal);
        request.input('CedulaPersona', sql.VarChar(50), cedulaFinal);
        request.input('EmpresaPersona', sql.VarChar(250), dto.empresaPersona || null);
        request.input('FotoUrl', sql.VarChar(500), fotoUrl);
        request.input('UsuarioRegistra', sql.VarChar(100), usuario);
        const result = await request.query(`
      INSERT INTO dbo.tblRegistroAcceso (EventoCursoId, EdificioId, TipoPersona, PersonaId, NombrePersona, CedulaPersona, EmpresaPersona, FotoUrl, UsuarioRegistra)
      OUTPUT INSERTED.*
      VALUES (@EventoCursoId, @EdificioId, @TipoPersona, @PersonaId, @NombrePersona, @CedulaPersona, @EmpresaPersona, @FotoUrl, @UsuarioRegistra)
    `);
        const r = result.recordset[0];
        return {
            id: r.Id, tipoPersona: r.TipoPersona, personaId: r.PersonaId,
            nombre: r.NombrePersona, fechaEntrada: r.FechaEntrada,
            fotoUrl: r.FotoUrl, edificioId: r.EdificioId,
        };
    }
    async registrarSalida(id) {
        const pool = await this.db.getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
        UPDATE dbo.tblRegistroAcceso
        SET FechaSalida = GETDATE()
        OUTPUT INSERTED.*
        WHERE Id = @id AND FechaSalida IS NULL
      `);
        if (!result.recordset[0])
            throw new common_1.NotFoundException('Registro no encontrado o ya tiene salida registrada.');
        const r = result.recordset[0];
        return { id: r.Id, fechaSalida: r.FechaSalida };
    }
    async accesosHoy(edificioId) {
        const pool = await this.db.getPool();
        let where = 'WHERE CAST(FechaEntrada AS DATE) = CAST(GETDATE() AS DATE)';
        if (edificioId) {
            where += ' AND EdificioId = @edificioId';
        }
        const request = pool.request();
        if (edificioId)
            request.input('edificioId', sql.Int, edificioId);
        const result = await request.query(`
      SELECT r.*, e.Nombre AS EdificioNombre
      FROM dbo.tblRegistroAcceso r
      INNER JOIN dbo.tblEdificios e ON r.EdificioId = e.Id
      ${where}
      ORDER BY r.FechaEntrada DESC
    `);
        return result.recordset.map(r => ({
            id: r.Id, tipoPersona: r.TipoPersona, personaId: r.PersonaId,
            nombre: r.NombrePersona, cedula: r.CedulaPersona, empresa: r.EmpresaPersona,
            edificio: r.EdificioNombre, fotoUrl: r.FotoUrl,
            fechaEntrada: r.FechaEntrada, fechaSalida: r.FechaSalida,
            usuarioRegistra: r.UsuarioRegistra,
        }));
    }
    async reporte(eventoId, edificioId, tipoPersona, desde, hasta, pagina = 1, porPagina = 50) {
        const pool = await this.db.getPool();
        const conditions = [];
        const request = pool.request();
        if (edificioId) {
            conditions.push('r.EdificioId = @edificioId');
            request.input('edificioId', sql.Int, edificioId);
        }
        if (tipoPersona) {
            conditions.push('r.TipoPersona = @tipoPersona');
            request.input('tipoPersona', sql.VarChar(30), tipoPersona);
        }
        if (desde) {
            conditions.push('r.FechaEntrada >= @desde');
            request.input('desde', sql.DateTime2(0), new Date(desde));
        }
        if (hasta) {
            conditions.push('r.FechaEntrada <= @hasta');
            request.input('hasta', sql.DateTime2(0), new Date(hasta));
        }
        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        const offset = (pagina - 1) * porPagina;
        const countResult = await request.query(`SELECT COUNT(*) AS total FROM dbo.tblRegistroAcceso r ${where}`);
        const total = countResult.recordset[0]?.total || 0;
        const dataResult = await request.query(`
      SELECT r.*, e.Nombre AS EdificioNombre
      FROM dbo.tblRegistroAcceso r
      INNER JOIN dbo.tblEdificios e ON r.EdificioId = e.Id
      ${where}
      ORDER BY r.FechaEntrada DESC
      OFFSET ${offset} ROWS FETCH NEXT ${porPagina} ROWS ONLY
    `);
        return {
            data: dataResult.recordset.map(r => ({
                id: r.Id, tipoPersona: r.TipoPersona, personaId: r.PersonaId,
                nombre: r.NombrePersona, cedula: r.CedulaPersona, empresa: r.EmpresaPersona,
                edificio: r.EdificioNombre, fotoUrl: r.FotoUrl,
                fechaEntrada: r.FechaEntrada, fechaSalida: r.FechaSalida,
                usuarioRegistra: r.UsuarioRegistra,
            })),
            total, pagina, porPagina,
        };
    }
    async savePhoto(file) {
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