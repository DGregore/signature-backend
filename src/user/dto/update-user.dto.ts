import { IsString, IsEmail, IsOptional, MinLength, IsInt, IsPositive, Length } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 255, { message: 'O nome deve ter entre 1 e 255 caracteres se fornecido.' }) // Use Length(1, ...) instead of IsNotEmpty for optional fields
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Formato de email inválido se fornecido.' })
  // IsEmail already implies it shouldn't be an empty string if provided
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres se fornecida.' })
  password?: string; // Senha é opcional na atualização

  @IsOptional()
  @IsInt({ message: 'O ID do setor deve ser um número inteiro se fornecido.' })
  @IsPositive({ message: 'O ID do setor deve ser um número positivo se fornecido.' })
  sectorId?: number;
}

