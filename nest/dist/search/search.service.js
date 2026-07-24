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
const hcm_service_1 = require("../integration/hcm.service");
let SearchService = class SearchService {
    constructor(db, hcm) {
        this.db = db;
        this.hcm = hcm;
    }
    async buscarEmpleado(q) {
        const pool = await this.db.getPool();
        const result = await pool.request()
            .input('Query', q)
            .execute('sp_Buscar_Empleado');
        return result.recordset;
    }
    async buscarProveedor(q) {
        const pool = await this.db.getPool();
        const result = await pool.request()
            .input('Query', q)
            .execute('sp_Buscar_Proveedor');
        return result.recordset;
    }
    async buscarInstructor(q) {
        const pool = await this.db.getPool();
        const result = await pool.request()
            .input('Query', q)
            .execute('sp_Buscar_Instructor');
        return result.recordset;
    }
    async buscarUbicaciones() {
        const pool = await this.db.getPool();
        const result = await pool.request().execute('sp_Buscar_Ubicaciones');
        return result.recordset;
    }
    async buscarPersonalExterno(q) {
        const pool = await this.db.getPool();
        const result = await pool.request()
            .input('Query', q)
            .execute('sp_Buscar_PersonalExterno');
        return result.recordset;
    }
    async obtenerFoto(carnet) {
        const foto = await this.hcm.obtenerFotoEmpleado(carnet);
        return { foto };
    }
    async obtenerEstado(carnet) {
        return this.hcm.obtenerEstadoEmpleado(carnet);
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        hcm_service_1.HcmService])
], SearchService);
//# sourceMappingURL=search.service.js.map