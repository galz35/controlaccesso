import { Controller, Get, Post, Put, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EdificiosService } from './edificios.service';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { EdificioDto } from '../common/dto/catalog.dto';

@Controller('edificios')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EdificiosController {
  constructor(private service: EdificiosService) {}

  @Get()
  @Roles('admin', 'registrador')
  async getAll() { return this.service.getAll(); }

  @Post()
  @Roles('admin')
  async create(@Body() dto: EdificioDto) { return this.service.create(dto); }

  @Put(':id')
  @Roles('admin')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: EdificioDto) { return this.service.update(id, dto); }
}
