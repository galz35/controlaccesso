import { Controller, Get, Post, Put, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InstructoresService } from './instructores.service';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { InstructorDto } from '../common/dto/catalog.dto';

@Controller('instructores')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class InstructoresController {
  constructor(private service: InstructoresService) {}

  @Get()
  @Roles('admin', 'registrador')
  async getAll() { return this.service.getAll(); }

  @Post()
  @Roles('admin')
  async create(@Body() dto: InstructorDto) { return this.service.create(dto); }

  @Put(':id')
  @Roles('admin')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: InstructorDto) { return this.service.update(id, dto); }
}
