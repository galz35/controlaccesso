import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, UseInterceptors, UploadedFile, ParseIntPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { AccesoService } from './acceso.service';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { RegistrarEntradaDto, ReporteQueryDto, SalidaIndependienteDto } from './dto/acceso.dto';

@Controller('acceso')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AccesoController {
  constructor(private acceso: AccesoService) {}

  @Post('entrada')
  @Roles('admin', 'registrador')
  @UseInterceptors(FileInterceptor('foto'))
  async entrada(@Body() dto: RegistrarEntradaDto, @Req() req: any, @UploadedFile() foto?: Express.Multer.File) {
    return this.acceso.registrarEntrada(dto, req.user.carnet || req.user.username || 'cpf', foto);
  }

  @Post('salida/:id')
  @Roles('admin', 'registrador')
  async salida(@Param('id', ParseIntPipe) id: number) {
    return this.acceso.registrarSalida(id);
  }

  @Post('salida-independiente')
  @Roles('admin', 'registrador')
  async salidaIndependiente(@Body() dto: SalidaIndependienteDto, @Req() req: any) {
    return this.acceso.registrarSalidaIndependiente(dto, req.user.carnet || req.user.username || 'cpf');
  }

  @Get('hoy')
  @Roles('admin', 'registrador')
  async hoy(@Query('edificioId') edificioId?: string) {
    return this.acceso.accesosHoy(edificioId ? parseInt(edificioId) : undefined);
  }

  @Get('pendientes')
  @Roles('admin', 'registrador')
  async pendientes(@Query('edificioId') edificioId?: string) {
    return this.acceso.accesosPendientes(edificioId ? parseInt(edificioId) : undefined);
  }

  @Get('reporte')
  @Roles('admin', 'registrador')
  async reporte(@Query() query: ReporteQueryDto) {
    return this.acceso.reporte(
      query.edificioId,
      query.tipoPersona,
      query.desde,
      query.hasta,
      query.pagina || 1,
      query.porPagina || 50,
      query.motivoAcceso,
    );
  }
}
