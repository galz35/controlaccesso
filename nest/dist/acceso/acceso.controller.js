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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccesoController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const passport_1 = require("@nestjs/passport");
const acceso_service_1 = require("./acceso.service");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
const acceso_dto_1 = require("./dto/acceso.dto");
let AccesoController = class AccesoController {
    constructor(acceso) {
        this.acceso = acceso;
    }
    async entrada(dto, req, foto) {
        return this.acceso.registrarEntrada(dto, req.user.carnet || req.user.username || 'cpf', foto);
    }
    async salida(id) {
        return this.acceso.registrarSalida(id);
    }
    async salidaIndependiente(dto, req) {
        return this.acceso.registrarSalidaIndependiente(dto, req.user.carnet || req.user.username || 'cpf');
    }
    async hoy(edificioId) {
        return this.acceso.accesosHoy(edificioId ? parseInt(edificioId) : undefined);
    }
    async pendientes(edificioId) {
        return this.acceso.accesosPendientes(edificioId ? parseInt(edificioId) : undefined);
    }
    async reporte(query) {
        return this.acceso.reporte(query.edificioId, query.tipoPersona, query.desde, query.hasta, query.pagina || 1, query.porPagina || 50, query.motivoAcceso);
    }
};
exports.AccesoController = AccesoController;
__decorate([
    (0, common_1.Post)('entrada'),
    (0, roles_decorator_1.Roles)('admin', 'registrador'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [acceso_dto_1.RegistrarEntradaDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AccesoController.prototype, "entrada", null);
__decorate([
    (0, common_1.Post)('salida/:id'),
    (0, roles_decorator_1.Roles)('admin', 'registrador'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AccesoController.prototype, "salida", null);
__decorate([
    (0, common_1.Post)('salida-independiente'),
    (0, roles_decorator_1.Roles)('admin', 'registrador'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [acceso_dto_1.SalidaIndependienteDto, Object]),
    __metadata("design:returntype", Promise)
], AccesoController.prototype, "salidaIndependiente", null);
__decorate([
    (0, common_1.Get)('hoy'),
    (0, roles_decorator_1.Roles)('admin', 'registrador'),
    __param(0, (0, common_1.Query)('edificioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AccesoController.prototype, "hoy", null);
__decorate([
    (0, common_1.Get)('pendientes'),
    (0, roles_decorator_1.Roles)('admin', 'registrador'),
    __param(0, (0, common_1.Query)('edificioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AccesoController.prototype, "pendientes", null);
__decorate([
    (0, common_1.Get)('reporte'),
    (0, roles_decorator_1.Roles)('admin', 'registrador'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [acceso_dto_1.ReporteQueryDto]),
    __metadata("design:returntype", Promise)
], AccesoController.prototype, "reporte", null);
exports.AccesoController = AccesoController = __decorate([
    (0, common_1.Controller)('acceso'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [acceso_service_1.AccesoService])
], AccesoController);
//# sourceMappingURL=acceso.controller.js.map