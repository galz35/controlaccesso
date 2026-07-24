import { IsInt, IsString, IsOptional, Min, IsIn, MinLength, MaxLength, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class RegistrarEntradaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  edificioId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  eventoCursoId?: number;

  @IsString()
  @IsIn(['EMPLEADO', 'PROVEEDOR', 'INSTRUCTOR_EXTERNO', 'INSTRUCTOR_INTERNO', 'VISITANTE', 'SERVICIO_EXTERNO'])
  @MaxLength(30)
  tipoPersona: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  personaId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(250)
  nombrePersona: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  cedulaPersona?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  empresaPersona?: string;

  @IsString()
  @IsIn(['Comedor', 'Servicio de cocina', 'Carga y descarga', 'Conductor/transporte', 'Entrega', 'Mantenimiento', 'Reunión', 'Visita general', 'Capacitación', 'Otro'])
  @MaxLength(100)
  motivoAcceso: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivoDetalle?: string;
}

export class ReporteQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  porPagina = 50;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  edificioId?: number;

  @IsOptional()
  @IsIn(['EMPLEADO', 'PROVEEDOR', 'INSTRUCTOR_EXTERNO', 'INSTRUCTOR_INTERNO', 'VISITANTE', 'SERVICIO_EXTERNO', 'SALIDA_INDEPENDIENTE'])
  @MaxLength(30)
  tipoPersona?: string;

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  @IsOptional()
  @MaxLength(100)
  motivoAcceso?: string;
}

export class SalidaIndependienteDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  edificioId: number;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  personaId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(250)
  nombrePersona: string;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  observacion: string;
}