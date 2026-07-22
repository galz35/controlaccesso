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
const sql = require("mssql");
let EventosCursoService = class EventosCursoService {
    constructor(db) {
        this.db = db;
    }
    async getAll() {
        const pool = await this.db.getPool();
        const result = await pool.request().query(`
      SELECT e.*, c.Nombre AS CursoNombre, ed.Nombre AS EdificioNombre
      FROM dbo.tblEventosCurso e
      INNER JOIN dbo.tblCursos c ON e.CursoId = c.Id
      INNER JOIN dbo.tblEdificios ed ON e.EdificioId = ed.Id
      WHERE e.Activo = 1
      ORDER BY e.FechaInicio DESC
    `);
        return result.recordset;
    }
    async create(dto) {
        const pool = await this.db.getPool();
        const request = pool.request();
        request.input('CursoId', sql.Int, dto.cursoId);
        request.input('EdificioId', sql.Int, dto.edificioId);
        request.input('FechaInicio', sql.DateTime2(0), new Date(dto.fechaInicio));
        request.input('FechaFin', sql.DateTime2(0), dto.fechaFin ? new Date(dto.fechaFin) : null);
        request.input('Observaciones', sql.VarChar(500), dto.observaciones || null);
        const result = await request.query(`
      INSERT INTO dbo.tblEventosCurso (CursoId, EdificioId, FechaInicio, FechaFin, Observaciones)
      OUTPUT INSERTED.*
      VALUES (@CursoId, @EdificioId, @FechaInicio, @FechaFin, @Observaciones)
    `);
        return result.recordset[0];
    }
    async update(id, dto) {
        const pool = await this.db.getPool();
        const request = pool.request();
        request.input('id', sql.Int, id);
        if (dto.cursoId !== undefined) {
            request.input('CursoId', sql.Int, dto.cursoId);
        }
        if (dto.edificioId !== undefined) {
            request.input('EdificioId', sql.Int, dto.edificioId);
        }
        if (dto.fechaInicio !== undefined) {
            request.input('FechaInicio', sql.DateTime2(0), new Date(dto.fechaInicio));
        }
        if (dto.fechaFin !== undefined) {
            request.input('FechaFin', sql.DateTime2(0), new Date(dto.fechaFin));
        }
        if (dto.observaciones !== undefined) {
            request.input('Observaciones', sql.VarChar(500), dto.observaciones);
        }
        const sets = [];
        if (dto.cursoId !== undefined)
            sets.push('CursoId = @CursoId');
        if (dto.edificioId !== undefined)
            sets.push('EdificioId = @EdificioId');
        if (dto.fechaInicio !== undefined)
            sets.push('FechaInicio = @FechaInicio');
        if (dto.fechaFin !== undefined)
            sets.push('FechaFin = @FechaFin');
        if (dto.observaciones !== undefined)
            sets.push('Observaciones = @Observaciones');
        const result = await request.query(`UPDATE dbo.tblEventosCurso SET ${sets.join(', ')} OUTPUT INSERTED.* WHERE Id = @id`);
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