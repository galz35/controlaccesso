import { Module } from '@nestjs/common';
import { CursoParticipantesController } from './curso-participantes.controller';
import { CursoParticipantesService } from './curso-participantes.service';

@Module({
  controllers: [CursoParticipantesController],
  providers: [CursoParticipantesService],
})
export class CursoParticipantesModule {}
