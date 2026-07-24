import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');

  const config = app.get(ConfigService);
  const nodeEnv = config.get<string>('NODE_ENV', 'development');
  const corsOrigins = config.get<string>('CORS_ORIGINS', '');
  const allowedOrigins = corsOrigins
    ? corsOrigins.split(',').map(s => s.trim())
    : nodeEnv === 'production' ? ['https://rhclaroni.com'] : true;
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, forbidNonWhitelisted: true, transform: true,
    disableErrorMessages: nodeEnv === 'production',
  }));

  // Servir archivos subidos (fotos)
  const uploadPath = config.get<string>('UPLOAD_PATH', './uploads');
  app.useStaticAssets(path.resolve(uploadPath), {
    prefix: '/control-acceso-uploads/',
    maxAge: '30d',
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, immutable, max-age=2592000');
    },
  });

  // Validar JWT_SECRET
  const jwtSecret = config.get<string>('JWT_SECRET');
  if (!jwtSecret || jwtSecret === 'control_acceso_jwt_secret_2026') {
    process.exit(1);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Control Acceso API running on port ${port}`);
}
bootstrap();