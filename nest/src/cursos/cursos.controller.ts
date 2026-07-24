import { Controller, Get, Post, Put, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CursosService } from './cursos.service';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CursoDto } from '../common/dto/catalog.dto';
import { ImportarCursosDto } from './dto/importar-cursos.dto';

@Controller('cursos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CursosController {
  constructor(private service: CursosService) {}

  @Get()
  @Roles('admin', 'registrador')
  async getAll() { return this.service.getAll(); }

  @Post()
  @Roles('admin')
  async create(@Body() dto: CursoDto) { return this.service.create(dto); }

  @Post('importar')
  @Roles('admin')
  async importar(@Body() dto: ImportarCursosDto) {
    return this.service.importar(dto.cursos);
  }

  @Put(':id')
  @Roles('admin')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: CursoDto) { return this.service.update(id, dto); }
}
