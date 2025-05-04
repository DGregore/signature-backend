import { IsString, IsOptional, IsEnum } from 'class-validator';
import { DocumentStatus } from '../document.entity';

export class UpdateDocumentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  // Optionally allow updating status directly (e.g., to CANCELED)
  // Be cautious with allowing direct status updates other than cancellation
  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus;

  // Note: Updating signatories might be complex and handled via separate endpoints
}

