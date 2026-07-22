import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { EdificiosModule } from './edificios/edificios.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { InstructoresModule } from './instructores/instructores.module';
import { CursosModule } from './cursos/cursos.module';
import { EventosCursoModule } from './eventos-curso/eventos-curso.module';
import { AccesoModule } from './acceso/acceso.module';
import { SearchModule } from './search/search.module';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';

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
    AccesoModule,
    SearchModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
