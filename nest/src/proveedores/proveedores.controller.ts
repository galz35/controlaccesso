import { Controller, Get, Post, Put, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProveedoresService } from './proveedores.service';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { ProveedorDto } from '../common/dto/catalog.dto';

@Controller('proveedores')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProveedoresController {
  constructor(private service: ProveedoresService) {}

  @Get()
  @Roles('admin', 'registrador')
  async getAll() { return this.service.getAll(); }

  @Post()
  @Roles('admin')
  async create(@Body() dto: ProveedorDto) { return this.service.create(dto); }

  @Put(':id')
  @Roles('admin')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: ProveedorDto) { return this.service.update(id, dto); }
}
