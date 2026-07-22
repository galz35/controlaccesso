"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const database_module_1 = require("./database/database.module");
const auth_module_1 = require("./auth/auth.module");
const edificios_module_1 = require("./edificios/edificios.module");
const proveedores_module_1 = require("./proveedores/proveedores.module");
const instructores_module_1 = require("./instructores/instructores.module");
const cursos_module_1 = require("./cursos/cursos.module");
const eventos_curso_module_1 = require("./eventos-curso/eventos-curso.module");
const acceso_module_1 = require("./acceso/acceso.module");
const search_module_1 = require("./search/search.module");
const app_controller_1 = require("./app.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            database_module_1.DatabaseModule,
            auth_module_1.AuthModule,
            edificios_module_1.EdificiosModule,
            proveedores_module_1.ProveedoresModule,
            instructores_module_1.InstructoresModule,
            cursos_module_1.CursosModule,
            eventos_curso_module_1.EventosCursoModule,
            acceso_module_1.AccesoModule,
            search_module_1.SearchModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map