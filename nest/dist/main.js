"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
const path = require("path");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    const config = app.get(config_1.ConfigService);
    const nodeEnv = config.get('NODE_ENV', 'development');
    const corsOrigins = config.get('CORS_ORIGINS', '');
    const allowedOrigins = corsOrigins
        ? corsOrigins.split(',').map(s => s.trim())
        : nodeEnv === 'production' ? ['https://rhclaroni.com'] : true;
    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true, forbidNonWhitelisted: true, transform: true,
        disableErrorMessages: nodeEnv === 'production',
    }));
    const uploadPath = config.get('UPLOAD_PATH', './uploads');
    app.useStaticAssets(path.resolve(uploadPath), {
        prefix: '/control-acceso-uploads/',
        maxAge: '30d',
        setHeaders: (res) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Cache-Control', 'public, immutable, max-age=2592000');
        },
    });
    const jwtSecret = config.get('JWT_SECRET');
    if (!jwtSecret || jwtSecret === 'control_acceso_jwt_secret_2026') {
        process.exit(1);
    }
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`Control Acceso API running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map