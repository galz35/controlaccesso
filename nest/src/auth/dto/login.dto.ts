import { IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class DevLoginDto {
  @IsString()
  carnet: string;
}

export class SsoLoginDto {
  @IsString()
  token: string;
}

export class CpfLoginDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class CpfRegisterDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  nombre: string;

  @IsString()
  @IsIn(['PROVEEDOR', 'INSTRUCTOR_EXTERNO'])
  tipo: string;

  @IsOptional()
  @IsString()
  correo?: string;

  @IsOptional()
  referenciaId?: number;

  @IsOptional()
  edificioIdDefecto?: number;
}

export class CpfChangePasswordDto {
  @IsString()
  username: string;

  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class AdminResetPasswordDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
