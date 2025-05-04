import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { SignatureService } from './signature.service';
import { CreateSignatureDto } from './dto/create-signature.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Adjust path if needed
import { Signature } from './signature.entity';

@Controller('api/signatures')
@UseGuards(JwtAuthGuard) // Protect all routes in this controller
export class SignatureController {
  private readonly logger = new Logger(SignatureController.name);

  constructor(private readonly signatureService: SignatureService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createSignatureDto: CreateSignatureDto,
    @Request() req: any, // Get user from request
  ): Promise<Signature> {
    const userId = req.user.userId; // Extract user ID from JWT payload
    this.logger.log(
      `User ID ${userId} submitting signature for document ID: ${createSignatureDto.documentId}`,
    );
    return this.signatureService.create(createSignatureDto, userId);
  }

  // Add other endpoints if needed (e.g., GET signatures for a document)
}

