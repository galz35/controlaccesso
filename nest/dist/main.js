"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.enableCors();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true,
        disableErrorMessages: process.env.NODE_ENV === 'production',
    }));
    const config = app.get(config_1.ConfigService);
    const jwtSecret = config.get('JWT_SECRET');
    if (!jwtSecret || jwtSecret === 'control_acceso_jwt_secret_2026') {
        console.warn('⚠️  JWT_SECRET no configurado o usa valor por defecto. Cambiar en producción.');
    }
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`Control Acceso API running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map