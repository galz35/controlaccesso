import { Controller, Get, Post, Put, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EventosCursoService } from './eventos-curso.service';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

@Controller('eventos-curso')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EventosCursoController {
  constructor(private service: EventosCursoService) {}

  @Get()
  @Roles('admin', 'registrador')
  async getAll(@Query('edificioId') edificioId?: string) {
    return this.service.getAll(edificioId ? parseInt(edificioId) : undefined);
  }

  @Post()
  @Roles('admin')
  async create(@Body() dto: any) { return this.service.create(dto); }

  @Put(':id')
  @Roles('admin')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.service.update(id, dto); }
}
