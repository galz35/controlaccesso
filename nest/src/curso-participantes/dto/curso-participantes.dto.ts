import { IsInt, IsString, MinLength, MaxLength, IsOptional, IsIn, Min, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CursoParticipanteItem {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  eventoCursoId: number;

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
}

export class ImportarParticipantesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CursoParticipanteItem)
  participantes: CursoParticipanteItem[];
}
