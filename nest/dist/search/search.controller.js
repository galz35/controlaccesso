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
exports.SearchController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const search_service_1 = require("./search.service");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
let SearchController = class SearchController {
    constructor(search) {
        this.search = search;
    }
    async empleado(q) { return this.search.buscarEmpleado(q || ''); }
    async proveedor(q) { return this.search.buscarProveedor(q || ''); }
    async instructor(q) { return this.search.buscarInstructor(q || ''); }
    async ubicaciones() { return this.search.buscarUbicaciones(); }
    async personalExterno(q) { return this.search.buscarPersonalExterno(q || ''); }
};
exports.SearchController = SearchController;
__decorate([
    (0, common_1.Get)('empleado'),
    (0, roles_decorator_1.Roles)('admin', 'registrador'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "empleado", null);
__decorate([
    (0, common_1.Get)('proveedor'),
    (0, roles_decorator_1.Roles)('admin', 'registrador'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "proveedor", null);
__decorate([
    (0, common_1.Get)('instructor'),
    (0, roles_decorator_1.Roles)('admin', 'registrador'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "instructor", null);
__decorate([
    (0, common_1.Get)('ubicaciones'),
    (0, roles_decorator_1.Roles)('admin', 'registrador'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "ubicaciones", null);
__decorate([
    (0, common_1.Get)('personal-externo'),
    (0, roles_decorator_1.Roles)('admin', 'registrador'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "personalExterno", null);
exports.SearchController = SearchController = __decorate([
    (0, common_1.Controller)('search'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [search_service_1.SearchService])
], SearchController);
//# sourceMappingURL=search.controller.js.map