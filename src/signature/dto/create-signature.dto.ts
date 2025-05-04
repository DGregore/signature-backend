import { IsNotEmpty, IsString, IsNumber, IsObject, ValidateNested, IsDefined } from 'class-validator';
import { Type } from 'class-transformer';

// DTO for position data
class PositionDataDto {
  @IsNumber()
  page: number;

  @IsNumber()
  x: number;

  @IsNumber()
  y: number;
}

export class CreateSignatureDto {
  @IsNumber()
  documentId: number;

  @IsString()
  @IsNotEmpty()
  signatureData: string; // Base64 string, SVG, or JSON for vector data

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => PositionDataDto)
  positionData: PositionDataDto;
}

