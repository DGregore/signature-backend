import { IsNumber, IsNotEmpty } from 'class-validator';

export class PositionDataDto {
  @IsNumber()
  @IsNotEmpty()
  x: number;

  @IsNumber()
  @IsNotEmpty()
  y: number;

  @IsNumber()
  @IsNotEmpty()
  page: number;
}

