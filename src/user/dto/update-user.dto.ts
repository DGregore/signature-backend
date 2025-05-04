import { IsString, IsEmail, IsOptional, MinLength, IsInt, IsPositive, Length, IsEnum } from 'class-validator';
import { UserRole } from '../user.entity'; // Import the enum

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 255, { message: 'O nome deve ter entre 1 e 255 caracteres se fornecido.' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Formato de email inválido se fornecido.' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres se fornecida.' })
  password?: string;

  @IsOptional()
  @IsInt({ message: 'O ID do setor deve ser um número inteiro se fornecido.' })
  @IsPositive({ message: 'O ID do setor deve ser um número positivo se fornecido.' })
  sectorId?: number;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Role inválido. Use \'admin\' ou \'user\'.' })
  role?: UserRole; // Add optional role field for updates
}

