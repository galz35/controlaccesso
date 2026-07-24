import { IsInt, IsString, IsOptional, Min, IsIn, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class RegistrarEntradaDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  edificioId: number;

  @IsOptional()
  @IsInt()
  eventoCursoId?: number;

  @IsString()
  @IsIn(['EMPLEADO', 'PROVEEDOR', 'INSTRUCTOR_EXTERNO', 'INSTRUCTOR_INTERNO', 'VISITANTE', 'SERVICIO_EXTERNO'])
  tipoPersona: string;

  @IsString()
  @MinLength(1)
  personaId: string;

  @IsString()
  @MinLength(2)
  nombrePersona: string;

  @IsOptional()
  @IsString()
  cedulaPersona?: string;

  @IsOptional()
  @IsString()
  empresaPersona?: string;

  @IsOptional()
  @IsString()
  motivoAcceso?: string;

  @IsOptional()
  @IsString()
  motivoDetalle?: string;
}

export class ReporteQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pagina?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  porPagina?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  edificioId?: number;

  @IsOptional()
  @IsString()
  tipoPersona?: string;

  @IsOptional()
  @IsString()
  desde?: string;

  @IsOptional()
  @IsString()
  hasta?: string;

  @IsOptional()
  @IsString()
  motivoAcceso?: string;
}

export class SalidaIndependienteDto {
  @IsInt()
  @Min(1)
  edificioId: number;

  @IsString()
  @MinLength(1)
  personaId: string;

  @IsString()
  @MinLength(2)
  nombrePersona: string;

  @IsString()
  @MinLength(5)
  observacion: string;

  @IsOptional()
  @IsString()
  motivoAcceso?: string;
}
