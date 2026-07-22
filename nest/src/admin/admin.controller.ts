import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('cpf-users')
  @Roles('admin')
  async getCpfUsers() {
    return this.admin.getCpfUsers();
  }
}
