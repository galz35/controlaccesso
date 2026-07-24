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
exports.EventosCursoService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let EventosCursoService = class EventosCursoService {
    constructor(db) {
        this.db = db;
    }
    async getAll(edificioId) {
        const pool = await this.db.getPool();
        const request = pool.request();
        request.input('EdificioId', edificioId || null);
        const result = await request.execute('sp_EventosCurso_ListarPorEdificio');
        return result.recordset;
    }
    async create(dto) {
        const pool = await this.db.getPool();
        const request = pool.request();
        request.input('CursoId', dto.cursoId);
        request.input('EdificioId', dto.edificioId);
        request.input('FechaInicio', new Date(dto.fechaInicio));
        request.input('FechaFin', dto.fechaFin ? new Date(dto.fechaFin) : null);
        request.input('Observaciones', dto.observaciones || null);
        const result = await request.execute('sp_EventosCurso_Crear');
        return result.recordset[0];
    }
    async update(id, dto) {
        const pool = await this.db.getPool();
        const request = pool.request();
        request.input('Id', id);
        if (dto.cursoId !== undefined)
            request.input('CursoId', dto.cursoId);
        if (dto.edificioId !== undefined)
            request.input('EdificioId', dto.edificioId);
        if (dto.fechaInicio !== undefined)
            request.input('FechaInicio', new Date(dto.fechaInicio));
        if (dto.fechaFin !== undefined)
            request.input('FechaFin', new Date(dto.fechaFin));
        if (dto.observaciones !== undefined)
            request.input('Observaciones', dto.observaciones);
        const result = await request.execute('sp_EventosCurso_Actualizar');
        if (!result.recordset[0])
            throw new common_1.NotFoundException('Registro no encontrado.');
        return result.recordset[0];
    }
};
exports.EventosCursoService = EventosCursoService;
exports.EventosCursoService = EventosCursoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], EventosCursoService);
//# sourceMappingURL=eventos-curso.service.js.map