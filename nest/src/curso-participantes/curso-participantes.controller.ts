import { Controller, Post, Get, Query, Body, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CursoParticipantesService } from './curso-participantes.service';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { ImportarParticipantesDto } from './dto/curso-participantes.dto';

@Controller('curso-participantes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CursoParticipantesController {
  constructor(private service: CursoParticipantesService) {}

  @Post('importar')
  @Roles('admin')
  async importar(@Body() dto: ImportarParticipantesDto, @Req() req: any) {
    return this.service.importar(
      dto.participantes,
      req.user?.username || req.user?.carnet || 'admin',
    );
  }

  @Get()
  @Roles('admin', 'registrador')
  async listar(
    @Query('tipoPersona') tipoPersona: string,
    @Query('personaId') personaId: string,
  ) {
    return this.service.listarPorPersona(tipoPersona, personaId);
  }

  @Get('por-curso/:cursoId')
  @Roles('admin', 'registrador')
  async listarPorCurso(@Param('cursoId', ParseIntPipe) cursoId: number) {
    return this.service.listarPorCurso(cursoId);
  }
}
