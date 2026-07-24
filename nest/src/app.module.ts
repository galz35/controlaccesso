import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { EdificiosModule } from './edificios/edificios.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { InstructoresModule } from './instructores/instructores.module';
import { CursosModule } from './cursos/cursos.module';
import { EventosCursoModule } from './eventos-curso/eventos-curso.module';
import { PersonalExternoModule } from './personal-externo/personal-externo.module';
import { AccesoModule } from './acceso/acceso.module';
import { SearchModule } from './search/search.module';
import { AdminModule } from './admin/admin.module';
import { CursoParticipantesModule } from './curso-participantes/curso-participantes.module';
import { AppController } from './app.controller';
import { RateLimiterMiddleware } from './common/rate-limiter.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    EdificiosModule,
    ProveedoresModule,
    InstructoresModule,
    CursosModule,
    EventosCursoModule,
    PersonalExternoModule,
    AccesoModule,
    SearchModule,
    AdminModule,
    CursoParticipantesModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimiterMiddleware).forRoutes('*');
  }
}