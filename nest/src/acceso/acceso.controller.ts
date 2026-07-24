import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, UseInterceptors, UploadedFile, ParseIntPipe, Res, BadRequestException, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AccesoService } from './acceso.service';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { resolveBuilding } from '../common/building.resolver';
import { RegistrarEntradaDto, ReporteQueryDto, SalidaIndependienteDto } from './dto/acceso.dto';

@Controller('acceso')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AccesoController {
  constructor(private acceso: AccesoService, private config: ConfigService) {}

  @Post('entrada')
  @Roles('admin', 'registrador')
  @UseInterceptors(FileInterceptor('foto', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  async entrada(@Body() dto: RegistrarEntradaDto, @Req() req: any, @UploadedFile() foto?: Express.Multer.File) {
    const photosEnabled = this.config.get('ENABLE_ACCESS_PHOTOS', 'false') === 'true';
    if (foto && !photosEnabled) {
      throw new BadRequestException('Carga de fotos no habilitada.');
    }
    const edificioId = resolveBuilding(req.user, dto.edificioId);
    return this.acceso.registrarEntrada({ ...dto, edificioId: edificioId! }, req.user.carnet || req.user.username || 'cpf', foto);
  }

  @Post('salida/:id')
  @Roles('admin', 'registrador')
  async salida(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const edificioId = resolveBuilding(req.user, undefined);
    return this.acceso.registrarSalida(id, req.user.carnet || req.user.username || 'cpf', edificioId);
  }

  @Post('salida-independiente')
  @Roles('admin', 'registrador')
  async salidaIndependiente(@Body() dto: SalidaIndependienteDto, @Req() req: any) {
    const edificioId = resolveBuilding(req.user, dto.edificioId);
    return this.acceso.registrarSalidaIndependiente({ ...dto, edificioId: edificioId! }, req.user.carnet || req.user.username || 'cpf');
  }

  @Get('hoy')
  @Roles('admin', 'registrador')
  async hoy(@Query('edificioId') raw: string, @Req() req: any) {
    const requested = raw ? parseInt(raw) : undefined;
    const edificioId = resolveBuilding(req.user, requested);
    return this.acceso.accesosHoy(edificioId);
  }

  @Get('pendientes')
  @Roles('admin', 'registrador')
  async pendientes(@Query('edificioId') raw: string, @Req() req: any) {
    const requested = raw ? parseInt(raw) : undefined;
    const edificioId = resolveBuilding(req.user, requested);
    return this.acceso.accesosPendientes(edificioId);
  }

  @Get('reporte')
  @Roles('admin', 'registrador')
  async reporte(@Query() query: ReporteQueryDto, @Req() req: any) {
    const edificioId = resolveBuilding(req.user, query.edificioId);
    return this.acceso.reporte(
      edificioId,
      query.tipoPersona,
      query.desde,
      query.hasta,
      query.pagina || 1,
      query.porPagina || 50,
      query.motivoAcceso,
    );
  }

  @Get('foto/:fileName')
  @Roles('admin', 'registrador')
  async getFoto(@Param('fileName') fileName: string, @Req() req: any, @Res() res: Response) {
    // Históricos pueden venir con prefijo: fotos_acceso/uuid.webp o /control-acceso-uploads/fotos_acceso/uuid.webp
    const cleaned = fileName.split('/').pop() || fileName;
    if (!/^[0-9a-f-]{36}\.webp$/i.test(cleaned)) {
      throw new BadRequestException('Archivo inválido.');
    }
    const uploadPath = await this.acceso.assertPhotoAccess(cleaned, req.user);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.sendFile(cleaned, { root: uploadPath });
  }
}