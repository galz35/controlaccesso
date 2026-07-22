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
exports.ProveedoresService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const sql = require("mssql");
let ProveedoresService = class ProveedoresService {
    constructor(db) {
        this.db = db;
    }
    async getAll() {
        const pool = await this.db.getPool();
        const result = await pool.request().query(`SELECT * FROM dbo.tblProveedores WHERE Activo = 1 ORDER BY Nombre`);
        return result.recordset;
    }
    async create(dto) {
        const pool = await this.db.getPool();
        const keys = Object.keys(dto);
        const cols = keys.map(k => k.charAt(0).toUpperCase() + k.slice(1));
        const params = keys.map(k => '@' + k);
        const request = pool.request();
        keys.forEach(k => {
            const val = dto[k] !== undefined ? dto[k] : null;
            request.input(k, sql.VarChar(250), val);
        });
        const result = await request.query(`INSERT INTO dbo.tblProveedores (${cols.join(', ')}) OUTPUT INSERTED.* VALUES (${params.join(', ')})`);
        return result.recordset[0];
    }
    async update(id, dto) {
        const pool = await this.db.getPool();
        const keys = Object.keys(dto);
        const sets = keys.map(k => k.charAt(0).toUpperCase() + k.slice(1) + ' = @' + k);
        const request = pool.request();
        request.input('id', sql.Int, id);
        keys.forEach(k => {
            const val = dto[k] !== undefined ? dto[k] : null;
            request.input(k, sql.VarChar(250), val);
        });
        const result = await request.query(`UPDATE dbo.tblProveedores SET ${sets.join(', ')} OUTPUT INSERTED.* WHERE Id = @id`);
        if (!result.recordset[0])
            throw new common_1.NotFoundException('Registro no encontrado.');
        return result.recordset[0];
    }
};
exports.ProveedoresService = ProveedoresService;
exports.ProveedoresService = ProveedoresService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ProveedoresService);
//# sourceMappingURL=proveedores.service.js.map