import { IsString, IsEmail, IsOptional, IsIn } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  npk?: string;

  @IsOptional()
  @IsString()
  nama_user?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

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
