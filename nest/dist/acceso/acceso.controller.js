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
const config_1 = require("@nestjs/config");
const acceso_service_1 = require("./acceso.service");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
const building_resolver_1 = require("../common/building.resolver");
const acceso_dto_1 = require("./dto/acceso.dto");
let AccesoController = class AccesoController {
    constructor(acceso, config) {
        this.acceso = acceso;
        this.config = config;
    }
    async entrada(dto, req, foto) {
        const photosEnabled = this.config.get('ENABLE_ACCESS_PHOTOS', 'false') === 'true';
        if (foto && !photosEnabled) {
            throw new common_1.BadRequestException('Carga de fotos no habilitada.');
        }
        const edificioId = (0, building_resolver_1.resolveBuilding)(req.user, dto.edificioId);
        return this.acceso.registrarEntrada({ ...dto, edificioId: edificioId }, req.user.carnet || req.user.username || 'cpf', foto);
    }
    async salida(id, req) {
        const edificioId = (0, building_resolver_1.resolveBuilding)(req.user, undefined);
        return this.acceso.registrarSalida(id, req.user.carnet || req.user.username || 'cpf', edificioId);
    }
    async salidaIndependiente(dto, req) {
        const edificioId = (0, building_resolver_1.resolveBuilding)(req.user, dto.edificioId);
        return this.acceso.registrarSalidaIndependiente({ ...dto, edificioId: edificioId }, req.user.carnet || req.user.username || 'cpf');
    }
    async hoy(raw, req) {
        const requested = raw ? parseInt(raw) : undefined;
        const edificioId = (0, building_resolver_1.resolveBuilding)(req.user, requested);
        return this.acceso.accesosHoy(edificioId);
    }
    async pendientes(raw, req) {
        const requested = raw ? parseInt(raw) : undefined;
        const edificioId = (0, building_resolver_1.resolveBuilding)(req.user, requested);
        return this.acceso.accesosPendientes(edificioId);
    }
    async reporte(query, req) {
        const edificioId = (0, building_resolver_1.resolveBuilding)(req.user, query.edificioId);
        return this.acceso.reporte(edificioId, query.tipoPersona, query.desde, query.hasta, query.pagina || 1, query.porPagina || 50, query.motivoAcceso);
    }
    async getFoto(fileName, req, res) {
        const cleaned = fileName.split('/').pop() || fileName;
        if (!/^[0-9a-f-]{36}\.webp$/i.test(cleaned)) {
            throw new common_1.BadRequestException('Archivo inválido.');
        }
        const uploadPath = await this.acceso.assertPhotoAccess(cleaned, req.user);
        res.setHeader('Cache-Control', 'private, no-store');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        return res.sendFile(cleaned, { root: uploadPath });
    }
};
exports.AccesoController = AccesoController;
__decorate([
    (0, common_1.Post)('entrada'),
    (0, roles_decorator_1.Roles)('admin', 'registrador'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } })),
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
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
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
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AccesoController.prototype, "hoy", null);
__decorate([
    (0, common_1.Get)('pendientes'),
    (0, roles_decorator_1.Roles)('admin', 'registrador'),
    __param(0, (0, common_1.Query)('edificioId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AccesoController.prototype, "pendientes", null);
__decorate([
    (0, common_1.Get)('reporte'),
    (0, roles_decorator_1.Roles)('admin', 'registrador'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [acceso_dto_1.ReporteQueryDto, Object]),
    __metadata("design:returntype", Promise)
], AccesoController.prototype, "reporte", null);
__decorate([
    (0, common_1.Get)('foto/:fileName'),
    (0, roles_decorator_1.Roles)('admin', 'registrador'),
    __param(0, (0, common_1.Param)('fileName')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AccesoController.prototype, "getFoto", null);
exports.AccesoController = AccesoController = __decorate([
    (0, common_1.Controller)('acceso'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [acceso_service_1.AccesoService, config_1.ConfigService])
], AccesoController);
//# sourceMappingURL=acceso.controller.js.map