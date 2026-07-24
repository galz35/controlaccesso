import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true,
    disableErrorMessages: process.env.NODE_ENV === 'production',
  }));

  // Validar secretos al arrancar
  const config = app.get(ConfigService);
  const jwtSecret = config.get<string>('JWT_SECRET');
  if (!jwtSecret || jwtSecret === 'control_acceso_jwt_secret_2026') {
    console.warn('⚠️  JWT_SECRET no configurado o usa valor por defecto. Cambiar en producción.');
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Control Acceso API running on port ${port}`);
}
bootstrap();
