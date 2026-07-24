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
exports.ProveedoresController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const proveedores_service_1 = require("./proveedores.service");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
const catalog_dto_1 = require("../common/dto/catalog.dto");
let ProveedoresController = class ProveedoresController {
    constructor(service) {
        this.service = service;
    }
    async getAll() { return this.service.getAll(); }
    async create(dto) { return this.service.create(dto); }
    async update(id, dto) { return this.service.update(id, dto); }
};
exports.ProveedoresController = ProveedoresController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin', 'registrador'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProveedoresController.prototype, "getAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [catalog_dto_1.ProveedorDto]),
    __metadata("design:returntype", Promise)
], ProveedoresController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, catalog_dto_1.ProveedorDto]),
    __metadata("design:returntype", Promise)
], ProveedoresController.prototype, "update", null);
exports.ProveedoresController = ProveedoresController = __decorate([
    (0, common_1.Controller)('proveedores'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [proveedores_service_1.ProveedoresService])
], ProveedoresController);
//# sourceMappingURL=proveedores.controller.js.map