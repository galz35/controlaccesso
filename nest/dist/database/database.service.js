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
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sql = require("mssql");
let DatabaseService = class DatabaseService {
    constructor(config) {
        this.config = config;
        this.pool = null;
    }
    async getPool() {
        if (this.pool?.connected)
            return this.pool;
        this.pool = await sql.connect({
            server: this.config.get('DB_SERVER', 'localhost'),
            port: parseInt(this.config.get('DB_PORT', '1433'), 10),
            user: this.config.get('DB_USER', 'sa'),
            password: this.config.get('DB_PASSWORD'),
            database: 'ControlAcceso',
            options: { encrypt: false, trustServerCertificate: true },
        });
        return this.pool;
    }
    async onModuleDestroy() {
        try {
            await this.pool?.close();
        }
        catch { }
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DatabaseService);
//# sourceMappingURL=database.service.js.map