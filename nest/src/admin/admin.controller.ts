import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
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

  @Post('cpf-deactivate')
  @Roles('admin')
  async deactivateCpf(@Body('username') username: string) {
    return this.admin.deactivateCpf(username);
  }

  @Post('cpf-activate')
  @Roles('admin')
  async activateCpf(@Body('username') username: string) {
    return this.admin.activateCpf(username);
  }

  @Post('cpf-change-building')
  @Roles('admin')
  async changeBuilding(@Body() body: { username: string; edificioIdDefecto?: number }) {
    return this.admin.changeBuilding(body.username, body.edificioIdDefecto);
  }
}
