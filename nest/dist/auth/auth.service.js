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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const database_service_1 = require("../database/database.service");
let AuthService = class AuthService {
    constructor(db, jwt) {
        this.db = db;
        this.jwt = jwt;
    }
    async devLogin(carnet) {
        const pool = await this.db.getPool();
        const result = await pool.request()
            .input('Carnet', carnet)
            .execute('sp_Login_Empleado');
        const user = result.recordset[0];
        if (!user)
            throw new common_1.UnauthorizedException('Usuario no encontrado.');
        const token = this.jwt.sign({ carnet: user.Carnet, nombre: user.Nombre, rol: user.Rol });
        return { access_token: token, user: { carnet: user.Carnet, nombre: user.Nombre, rol: user.Rol } };
    }
    async me(carnet) {
        const pool = await this.db.getPool();
        const result = await pool.request()
            .input('Carnet', carnet)
            .execute('sp_Login_Empleado');
        const u = result.recordset[0];
        if (!u)
            return null;
        return { carnet: u.Carnet, nombre: u.Nombre, rol: u.Rol };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map