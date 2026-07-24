import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { IsString, MinLength, MaxLength, IsOptional, IsInt, Min } from 'class-validator';

export class CursoImportItem {
  @IsString()
  @MinLength(2)
  @MaxLength(250)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duracionHoras?: number;
}

export class ImportarCursosDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CursoImportItem)
  cursos: CursoImportItem[];
}
