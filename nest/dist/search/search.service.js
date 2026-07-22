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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const sql = require("mssql");
let SearchService = class SearchService {
    constructor(db) {
        this.db = db;
    }
    async buscarEmpleado(q) {
        const pool = await this.db.getPool();
        const result = await pool.request()
            .input('q', sql.VarChar(100), `%${q}%`)
            .query(`
        SELECT TOP 20 carnet, nombreCompleto AS nombre, cedula, ubicacion, gerencia, activo
        FROM bdplaner.dbo.p_Usuarios
        WHERE activo = 1 AND (carnet LIKE @q OR nombreCompleto LIKE @q)
        ORDER BY nombreCompleto
      `);
        return result.recordset;
    }
    async buscarProveedor(q) {
        const pool = await this.db.getPool();
        const result = await pool.request()
            .input('q', sql.VarChar(100), `%${q}%`)
            .query(`
        SELECT TOP 20 Id AS id, Nombre, Cedula AS cedula, Empresa, Telefono
        FROM dbo.tblProveedores
        WHERE Activo = 1 AND (Nombre LIKE @q OR Cedula LIKE @q OR Empresa LIKE @q)
        ORDER BY Nombre
      `);
        return result.recordset;
    }
    async buscarInstructor(q) {
        const pool = await this.db.getPool();
        const result = await pool.request()
            .input('q', sql.VarChar(100), `%${q}%`)
            .query(`
        SELECT TOP 20 Id AS id, Nombre, Cedula AS cedula, Empresa, Telefono, Especialidad
        FROM dbo.tblInstructores
        WHERE Activo = 1 AND (Nombre LIKE @q OR Cedula LIKE @q)
        ORDER BY Nombre
      `);
        return result.recordset;
    }
    async buscarUbicaciones() {
        const pool = await this.db.getPool();
        const result = await pool.request()
            .query(`
        SELECT DISTINCT ubicacion FROM bdplaner.dbo.p_Usuarios
        WHERE ubicacion IS NOT NULL AND ubicacion != '' AND activo = 1
        ORDER BY ubicacion
      `);
        return result.recordset.map(r => ({ nombre: r.ubicacion }));
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], SearchService);
//# sourceMappingURL=search.service.js.map