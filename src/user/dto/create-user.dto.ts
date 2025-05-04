import { IsString, IsEmail, IsNotEmpty, MinLength, IsInt, IsPositive } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome não pode estar vazio.' })
  name: string;

  @IsEmail({}, { message: 'Formato de email inválido.' })
  @IsNotEmpty({ message: 'O email não pode estar vazio.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'A senha não pode estar vazia.' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password: string;

  @IsInt({ message: 'O ID do setor deve ser um número inteiro.' })
  @IsPositive({ message: 'O ID do setor deve ser um número positivo.' })
  @IsNotEmpty({ message: 'O ID do setor não pode estar vazio.' })
  sectorId: number;
}
