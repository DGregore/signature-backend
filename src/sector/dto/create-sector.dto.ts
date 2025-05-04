import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSectorDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do setor não pode estar vazio.' })
  name: string;
}
