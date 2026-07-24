import { IsString, IsOptional, MinLength, MaxLength, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class EdificioDto {
  @IsString()
  @MinLength(2)
  @MaxLength(250)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  direccion?: string;
}

export class ProveedorDto {
  @IsString()
  @MinLength(2)
  @MaxLength(250)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  cedula?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ruc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  correo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  empresa?: string;
}

export class InstructorDto {
  @IsString()
  @MinLength(2)
  @MaxLength(250)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  cedula?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  correo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  empresa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  especialidad?: string;
}

export class CursoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(250)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duracionHoras?: number;
}

export class EventoCursoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cursoId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  edificioId: number;

  @IsString()
  @MinLength(1)
  fechaInicio: string;

  @IsOptional()
  @IsString()
  fechaFin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;
}

export class PersonalExternoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  codigo: string;

  @IsString()
  @MinLength(2)
  @MaxLength(250)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  cedula?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  empresa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  servicio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  telefono?: string;
}
