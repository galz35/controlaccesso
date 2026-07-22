import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, UseInterceptors, UploadedFile, ParseIntPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { AccesoService } from './acceso.service';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

@Controller('acceso')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AccesoController {
  constructor(private acceso: AccesoService) {}

  @Post('entrada')
  @Roles('admin', 'registrador')
  @UseInterceptors(FileInterceptor('foto'))
  async entrada(@Body() dto: any, @Req() req: any, @UploadedFile() foto?: Express.Multer.File) {
    return this.acceso.registrarEntrada(dto, req.user.carnet, foto);
  }

  @Post('salida/:id')
  @Roles('admin', 'registrador')
  async salida(@Param('id', ParseIntPipe) id: number) {
    return this.acceso.registrarSalida(id);
  }

  @Get('hoy')
  @Roles('admin', 'registrador')
  async hoy(@Query('edificioId') edificioId?: string) {
    return this.acceso.accesosHoy(edificioId ? parseInt(edificioId) : undefined);
  }

  @Get('reporte')
  @Roles('admin', 'registrador')
  async reporte(
    @Query('edificioId') edificioId?: string,
    @Query('tipoPersona') tipoPersona?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('pagina') pagina?: string,
    @Query('porPagina') porPagina?: string,
  ) {
    return this.acceso.reporte(
      edificioId ? parseInt(edificioId) : undefined,
      tipoPersona, desde, hasta,
      pagina ? parseInt(pagina) : 1,
      porPagina ? parseInt(porPagina) : 50,
    );
  }
}
