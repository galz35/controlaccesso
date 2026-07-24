import { Controller, Post, Get, Body, Param, Query, ParseIntPipe, UseGuards, Req, UseInterceptors, UploadedFile, Res, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
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

  @Post('importar-excel')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('archivo', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  async importarExcel(@UploadedFile() archivo: Express.Multer.File, @Req() req: any) {
    if (!archivo) throw new BadRequestException('Sube un archivo Excel');
    return this.service.importarExcel(
      archivo.buffer,
      req.user?.username || req.user?.carnet || 'admin',
    );
  }

  @Get('plantilla')
  @Roles('admin')
  async descargarPlantilla(@Res() res: Response) {
    const buffer = await this.service.generarPlantilla();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla_participantes.xlsx');
    res.send(buffer);
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
