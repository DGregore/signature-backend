import { Injectable, NotFoundException, ForbiddenException, Logger, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Signature } from './signature.entity';
import { DocumentService } from '../document/document.service';
import { DocumentSignatory, SignatoryStatus } from '../document/document-signatory.entity';
import { CreateSignatureDto } from './dto/create-signature.dto';
import { AuditLogService } from '../audit-log/audit-log.service'; // Import AuditLogService

@Injectable()
export class SignatureService {
  private readonly logger = new Logger(SignatureService.name);

  constructor(
    @InjectRepository(Signature)
    private signatureRepository: Repository<Signature>,
    @InjectRepository(DocumentSignatory)
    private signatoryRepository: Repository<DocumentSignatory>,
    private documentService: DocumentService,
    @Inject(forwardRef(() => AuditLogService)) // Inject AuditLogService
    private auditLogService: AuditLogService,
  ) {}

  async create(createDto: CreateSignatureDto, userId: number): Promise<Signature> {
    this.logger.log(`Attempting to create signature for document ID: ${createDto.documentId} by user ID: ${userId}`);

    // 1. Verify if the user is the correct signatory and if it's their turn
    const isReady = await this.documentService.isDocumentReadyForUser(createDto.documentId, userId);
    if (!isReady) {
      this.logger.warn(`User ID ${userId} is not the correct next signatory for document ID ${createDto.documentId}.`);
      throw new ForbiddenException('Não é a sua vez de assinar este documento ou o documento não está pronto para assinatura.');
    }

    // Find the specific DocumentSignatory record
    const signatoryRecord = await this.signatoryRepository.findOne({
        where: { document: { id: createDto.documentId }, user: { id: userId }, status: SignatoryStatus.PENDING }
    });

    if (!signatoryRecord) {
        this.logger.error(`Could not find PENDING signatory record for user ${userId} and document ${createDto.documentId}.`);
        throw new NotFoundException('Registro de signatário pendente não encontrado.');
    }

    // 2. Create and save the Signature entity
    const signature = this.signatureRepository.create({
      document: { id: createDto.documentId },
      user: { id: userId },
      signatureData: createDto.signatureData,
      positionData: createDto.positionData,
    });

    const savedSignature = await this.signatureRepository.save(signature);
    this.logger.log(`Signature saved with ID: ${savedSignature.id}`);

    // Log audit trail (Task 1.11)
    this.auditLogService.logAction(userId, 'CREATE_SIGNATURE', 'Signature', savedSignature.id, { documentId: createDto.documentId });

    // 3. Update the signatory status and advance the document flow (this triggers notifications and audit logs via DocumentService)
    try {
      await this.documentService.updateSignatoryStatus(createDto.documentId, userId, SignatoryStatus.SIGNED);
      this.logger.log(`Document flow updated for document ID: ${createDto.documentId} after signature by user ID: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to update document flow after saving signature ID ${savedSignature.id}: ${error.message}`, error.stack);
      // Consider compensation logic if needed
      throw error;
    }

    return savedSignature;
  }
}

