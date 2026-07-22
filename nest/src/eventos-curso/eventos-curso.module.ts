import { Module } from '@nestjs/common';
import { EventosCursoController } from './eventos-curso.controller';
import { EventosCursoService } from './eventos-curso.service';

@Module({
  controllers: [EventosCursoController],
  providers: [EventosCursoService],
})
export class EventosCursoModule {}
