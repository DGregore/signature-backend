import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateSectorDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'O nome do setor não pode estar vazio se fornecido.' })
  name?: string;
}

