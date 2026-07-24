import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccesoController } from './acceso.controller';
import { AccesoService } from './acceso.service';

@Module({
  imports: [ConfigModule],
  controllers: [AccesoController],
  providers: [AccesoService],
})
export class AccesoModule {}
