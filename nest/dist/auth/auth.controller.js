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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const auth_service_1 = require("./auth.service");
const sso_auth_service_1 = require("./sso-auth.service");
const cpf_auth_service_1 = require("./cpf-auth.service");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
let AuthController = class AuthController {
    constructor(auth, sso, cpf) {
        this.auth = auth;
        this.sso = sso;
        this.cpf = cpf;
    }
    async devLogin(dto) {
        return this.auth.devLogin(dto.carnet);
    }
    async ssoLogin(dto) {
        return this.sso.ssoLogin(dto.token);
    }
    async cpfLogin(dto) {
        return this.cpf.login(dto.username, dto.password);
    }
    async cpfRegister(dto) {
        return this.cpf.register(dto);
    }
    async cpfChangePassword(dto, req) {
        const targetUser = req.user.cpf ? req.user.username : null;
        if (!req.user.cpf && req.user.rol !== 'admin') {
            throw new Error('No autorizado');
        }
        return this.cpf.changePassword(dto.username, dto.oldPassword, dto.newPassword);
    }
    async me(req) {
        if (req.user.cpf) {
            return { ...req.user, tipo: 'CPF' };
        }
        return this.auth.me(req.user.carnet);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('dev-login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "devLogin", null);
__decorate([
    (0, common_1.Post)('sso-login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "ssoLogin", null);
__decorate([
    (0, common_1.Post)('cpf-login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "cpfLogin", null);
__decorate([
    (0, common_1.Post)('cpf-register'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "cpfRegister", null);
__decorate([
    (0, common_1.Put)('cpf-password'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'registrador'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "cpfChangePassword", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        sso_auth_service_1.SsoAuthService,
        cpf_auth_service_1.CpfAuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map