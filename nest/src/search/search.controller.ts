import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SearchService } from './search.service';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

@Controller('search')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SearchController {
  constructor(private search: SearchService) {}

  @Get('empleado')
  @Roles('admin', 'registrador')
  async empleado(@Query('q') q: string) { return this.search.buscarEmpleado(q || ''); }

  @Get('proveedor')
  @Roles('admin', 'registrador')
  async proveedor(@Query('q') q: string) { return this.search.buscarProveedor(q || ''); }

  @Get('instructor')
  @Roles('admin', 'registrador')
  async instructor(@Query('q') q: string) { return this.search.buscarInstructor(q || ''); }

  @Get('ubicaciones')
  @Roles('admin', 'registrador')
  async ubicaciones() { return this.search.buscarUbicaciones(); }

  @Get('personal-externo')
  @Roles('admin', 'registrador')
  async personalExterno(@Query('q') q: string) { return this.search.buscarPersonalExterno(q || ''); }
}
