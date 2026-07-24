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
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const auth_service_1 = require("./auth.service");
const sso_auth_service_1 = require("./sso-auth.service");
const cpf_auth_service_1 = require("./cpf-auth.service");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
const login_dto_1 = require("./dto/login.dto");
let AuthController = class AuthController {
    constructor(auth, sso, cpf, config) {
        this.auth = auth;
        this.sso = sso;
        this.cpf = cpf;
        this.config = config;
    }
    async devLogin(dto) {
        if (this.config.get('NODE_ENV') === 'production') {
            throw new common_1.ForbiddenException('Login de desarrollo no disponible en producción.');
        }
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
        return this.cpf.changePassword(dto.username, dto.oldPassword, dto.newPassword);
    }
    async adminResetPassword(dto) {
        return this.cpf.adminResetPassword(dto.username, dto.newPassword);
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
    __metadata("design:paramtypes", [login_dto_1.DevLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "devLogin", null);
__decorate([
    (0, common_1.Post)('sso-login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.SsoLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "ssoLogin", null);
__decorate([
    (0, common_1.Post)('cpf-login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.CpfLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "cpfLogin", null);
__decorate([
    (0, common_1.Post)('cpf-register'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.CpfRegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "cpfRegister", null);
__decorate([
    (0, common_1.Put)('cpf-password'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'registrador'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.CpfChangePasswordDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "cpfChangePassword", null);
__decorate([
    (0, common_1.Post)('admin-reset-password'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.AdminResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "adminResetPassword", null);
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
        cpf_auth_service_1.CpfAuthService,
        config_1.ConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map