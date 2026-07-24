import { Controller, Get, Post, Put, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PersonalExternoService } from './personal-externo.service';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

@Controller('personal-externo')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PersonalExternoController {
  constructor(private service: PersonalExternoService) {}

  @Get()
  @Roles('admin', 'registrador')
  async getAll() { return this.service.getAll(); }

  @Post()
  @Roles('admin')
  async create(@Body() dto: any) { return this.service.create(dto); }

  @Put(':id')
  @Roles('admin')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.service.update(id, dto); }
}
