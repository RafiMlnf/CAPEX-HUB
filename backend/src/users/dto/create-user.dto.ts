import { IsString, IsEmail, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  npk: string;

  @IsOptional()
  @IsString()
  nama_user?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  departemen_id?: number | string;

  @IsOptional()
  department?: string;

  @IsOptional()
  role_id?: number | string;

  @IsOptional()
  role?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;
}
