import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException, Logger, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOneOptions, In } from 'typeorm';
import { Document, DocumentStatus } from './document.entity';
import { DocumentSignatory, SignatoryStatus } from './document-signatory.entity';
import { User, UserRole } from '../user/user.entity';
import { MinioService } from './minio.service';
import { UploadDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { NotificationService } from '../notification/notification.service';
import { AuditLogService } from '../audit-log/audit-log.service'; // Import AuditLogService
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(DocumentSignatory)
    private signatoryRepository: Repository<DocumentSignatory>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private minioService: MinioService,
    @Inject(forwardRef(() => NotificationService))
    private notificationService: NotificationService,
    @Inject(forwardRef(() => AuditLogService)) // Inject AuditLogService
    private auditLogService: AuditLogService,
  ) {}

  // --- Create Document --- //
  async create(uploadDto: UploadDocumentDto, file: Express.Multer.File, ownerId: number): Promise<Document> {
    this.logger.log(`Creating document: ${file.originalname} for owner ID: ${ownerId}`);
    const owner = await this.userRepository.findOne({ where: { id: ownerId } });
    if (!owner) {
      this.logger.error(`Owner with ID ${ownerId} not found.`);
      throw new NotFoundException(`Usuário proprietário com ID ${ownerId} não encontrado.`);
    }

    const fileExtension = file.originalname.split('.').pop() || 'bin';
    const storagePath = `documents/${uuidv4()}.${fileExtension}`;

    let savedDocument: Document | null = null;

    try {
      await this.minioService.uploadFile(storagePath, file.buffer, file.mimetype);
      this.logger.log(`File uploaded to MinIO at path: ${storagePath}`);

      const document = this.documentRepository.create({
        title: uploadDto.title,
        description: uploadDto.description,
        originalFilename: file.originalname,
        storagePath: storagePath,
        mimeType: file.mimetype,
        size: file.buffer.length,
        owner: owner,
        status: (uploadDto.signatories && uploadDto.signatories.length > 0) ? DocumentStatus.SIGNING : DocumentStatus.PENDING,
      });

      savedDocument = await this.documentRepository.save(document);
      this.logger.log(`Document metadata saved with ID: ${savedDocument.id}`);

      // Log audit trail (Task 1.11)
      await this.auditLogService.logAction(ownerId, 'CREATE_DOCUMENT', 'Document', savedDocument.id, { title: savedDocument.title });

      if (uploadDto.signatories && uploadDto.signatories.length > 0) {
        const signatoryUsers = await this.userRepository.find({
          where: { id: In(uploadDto.signatories.map(s => s.userId)) }
        });
        const userMap = new Map(signatoryUsers.map(u => [u.id, u]));

        const signatoryEntities = uploadDto.signatories.map(sigDto => {
          const user = userMap.get(sigDto.userId);
          if (!user) {
            this.logger.warn(`Signatory user with ID ${sigDto.userId} not found during document creation. Skipping.`);
            return null;
          }
          return this.signatoryRepository.create({
            document: savedDocument as Document,
            user: user,
            order: sigDto.order,
            status: SignatoryStatus.PENDING,
          });
        }).filter(s => s !== null) as DocumentSignatory[];

        if (signatoryEntities.length > 0) {
          const savedSignatories = await this.signatoryRepository.save(signatoryEntities);
          this.logger.log(`Saved ${savedSignatories.length} signatories for document ID: ${savedDocument.id}`);
          // Log audit trail for adding signatories
          await this.auditLogService.logAction(ownerId, 'ADD_SIGNATORIES', 'Document', savedDocument.id, { signatoryIds: savedSignatories.map(s => s.user.id) });
          await this.notifyNextSignatories(savedDocument.id);
        } else {
          this.logger.warn(`No valid signatories found or saved for document ID: ${savedDocument.id}. Setting status to PENDING.`);
          savedDocument.status = DocumentStatus.PENDING;
          await this.documentRepository.save(savedDocument);
        }
      } else {
        this.logger.log(`No signatories provided for document ID: ${savedDocument.id}. Status is PENDING.`);
      }

      return savedDocument;

    } catch (error) {
      this.logger.error(`Failed to create document: ${error.message}`, error.stack);
      // Attempt cleanup only if MinIO upload succeeded but DB save failed
      if (savedDocument === null && storagePath) { // Check if storagePath is defined
          try {
              await this.minioService.deleteFile(storagePath);
              this.logger.log(`Cleaned up MinIO file due to error: ${storagePath}`);
          } catch (cleanupError) {
              this.logger.error(`Failed to cleanup MinIO file ${storagePath}: ${cleanupError.message}`, cleanupError.stack);
          }
      }
      throw new InternalServerErrorException(`Falha ao criar documento: ${error.message}`);
    }
  }

  // --- Find Documents --- //
  async findAll(options?: FindManyOptions<Document>): Promise<Document[]> {
    this.logger.log(`Finding all documents with options: ${JSON.stringify(options)}`);
    // TODO: Add permission checks based on user
    return this.documentRepository.find(options);
  }

  async findOne(id: number, userId: number, userRole: UserRole): Promise<Document> {
    this.logger.log(`Finding document ID: ${id} for user ID: ${userId}`);
    const options: FindOneOptions<Document> = {
      where: { id },
      relations: ['owner', 'signatories', 'signatories.user'],
    };
    const document = await this.documentRepository.findOne(options);

    if (!document) {
      throw new NotFoundException(`Documento com ID ${id} não encontrado.`);
    }

    if (userRole === UserRole.ADMIN || document.owner.id === userId || document.signatories.some(sig => sig.user.id === userId)) {
        // Log audit trail (Task 1.11)
        await this.auditLogService.logAction(userId, 'VIEW_DOCUMENT', 'Document', document.id);
        return document;
    }

    this.logger.warn(`User ID ${userId} does not have permission to access document ID ${id}.`);
    throw new ForbiddenException('Você não tem permissão para acessar este documento.');
  }

  async findPendingForUser(userId: number): Promise<Document[]> {
    this.logger.log(`Finding documents pending signature for user ID: ${userId}`);
    const pendingSignatories = await this.signatoryRepository.find({
        where: { user: { id: userId }, status: SignatoryStatus.PENDING },
        relations: ['document', 'document.owner'],
    });

    const pendingDocuments = pendingSignatories
        .map(sig => sig.document)
        .filter(doc => doc && doc.status === DocumentStatus.SIGNING); // Ensure doc is not null

    const documentsReadyForUser: Document[] = []; // Explicitly type the array
    for (const doc of pendingDocuments) {
        if (doc) { // Add null check for safety
            const isReady = await this.isDocumentReadyForUser(doc.id, userId);
            if (isReady) {
                documentsReadyForUser.push(doc);
            }
        }
    }

    this.logger.log(`Found ${documentsReadyForUser.length} documents ready for user ID: ${userId}`);
    return documentsReadyForUser;
  }

  // --- Download Document --- //
  async getDownloadStream(id: number, userId: number, userRole: UserRole): Promise<{ stream: Readable, filename: string, mimetype: string }> {
    this.logger.log(`Requesting download stream for document ID: ${id} by user ID: ${userId}`);
    const document = await this.findOne(id, userId, userRole); // Permission check included

    try {
      const stream = await this.minioService.downloadFile(document.storagePath);
      this.logger.log(`Retrieved download stream for path: ${document.storagePath}`);
      // Log audit trail (Task 1.11)
      await this.auditLogService.logAction(userId, 'DOWNLOAD_DOCUMENT', 'Document', document.id);
      return {
        stream: stream,
        filename: document.originalFilename,
        mimetype: document.mimeType,
      };
    } catch (error) {
      this.logger.error(`Failed to get download stream for document ID ${id}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) { // Propagate NotFoundException from MinioService
          throw error;
      }
      throw new InternalServerErrorException(`Falha ao baixar o documento: ${error.message}`);
    }
  }

  // --- Update Document --- //
  async update(id: number, updateDto: UpdateDocumentDto, userId: number, userRole: UserRole): Promise<Document> {
    this.logger.log(`Updating document ID: ${id} by user ID: ${userId}`);
    const document = await this.findOne(id, userId, userRole); // Permission check included

    if (document.owner.id !== userId && userRole !== UserRole.ADMIN) {
       this.logger.warn(`User ID ${userId} is not owner or admin, cannot update document ID ${id}.`);
       throw new ForbiddenException('Você não tem permissão para atualizar este documento.');
    }

    let statusChanged = false;
    let originalStatus = document.status;
    let changes: Record<string, any> = {}; // Track changes for audit log

    if (updateDto.status && updateDto.status !== document.status) {
        if (updateDto.status === DocumentStatus.CANCELED) {
            if (document.status === DocumentStatus.SIGNING || document.status === DocumentStatus.PENDING) { // Allow cancellation from PENDING too
                document.status = DocumentStatus.CANCELED;
                statusChanged = true;
                changes['status'] = { from: originalStatus, to: DocumentStatus.CANCELED };
            } else {
                throw new BadRequestException(`Não é possível cancelar um documento com status ${document.status}.`);
            }
        } else if (userRole !== UserRole.ADMIN) {
            this.logger.warn(`User ID ${userId} attempted forbidden status change on doc ID ${id} to ${updateDto.status}.`);
            throw new ForbiddenException('Não é permitido alterar o status do documento para este valor.');
        } else {
            // Allow admin to change status (use with caution)
            document.status = updateDto.status;
            statusChanged = true;
            changes['status'] = { from: originalStatus, to: updateDto.status };
        }
        // Don't delete updateDto.status here, let merge handle it
    }

    // Track other changes
    if (updateDto.title && updateDto.title !== document.title) changes['title'] = { from: document.title, to: updateDto.title };
    if (updateDto.description && updateDto.description !== document.description) changes['description'] = { from: document.description, to: updateDto.description };
    // Add other fields as needed

    this.documentRepository.merge(document, updateDto);
    const updatedDocument = await this.documentRepository.save(document);
    this.logger.log(`Document ID: ${id} updated successfully.`);

    // Log audit trail for update
    if (Object.keys(changes).length > 0) {
        const action = statusChanged && updatedDocument.status === DocumentStatus.CANCELED ? 'CANCEL_DOCUMENT' : 'UPDATE_DOCUMENT';
        await this.auditLogService.logAction(userId, action, 'Document', updatedDocument.id, { changes });
    }

    // Notify about cancellation if status changed to CANCELED
    if (statusChanged && updatedDocument.status === DocumentStatus.CANCELED) {
        this.notificationService.notifyDocumentCancelled(updatedDocument);
    }

    return updatedDocument;
  }

  // --- Delete Document --- //
  async delete(id: number, userId: number, userRole: UserRole): Promise<void> {
    this.logger.log(`Deleting document ID: ${id} by user ID: ${userId}`);
    const document = await this.findOne(id, userId, userRole); // Permission check included

    if (document.owner.id !== userId && userRole !== UserRole.ADMIN) {
       this.logger.warn(`User ID ${userId} is not owner or admin, cannot delete document ID ${id}.`);
       throw new ForbiddenException('Você não tem permissão para excluir este documento.');
    }

    const storagePath = document.storagePath; // Store path before deleting document record

    try {
      // Delete DB record first
      await this.documentRepository.delete(id);
      this.logger.log(`Document ID: ${id} deleted successfully from database.`);
      // Log audit trail (Task 1.11)
      await this.auditLogService.logAction(userId, 'DELETE_DOCUMENT', 'Document', id, { title: document.title });

      // Then delete file from MinIO
      try {
          await this.minioService.deleteFile(storagePath);
          this.logger.log(`File deleted from MinIO path: ${storagePath}`);
      } catch (minioError) {
          // Log error but don't fail the whole operation if DB delete succeeded
          this.logger.error(`Failed to delete file from MinIO path ${storagePath}: ${minioError.message}`, minioError.stack);
      }

    } catch (error) {
       this.logger.error(`Failed to delete document ID ${id} from database: ${error.message}`, error.stack);
       throw new InternalServerErrorException(`Falha ao excluir documento: ${error.message}`);
    }
  }

  // --- Signature Flow Logic --- //

  async isDocumentReadyForUser(documentId: number, userId: number): Promise<boolean> {
    const nextSignatories = await this.findNextSignatories(documentId);
    return nextSignatories.some(sig => sig.user.id === userId);
  }

  async findNextSignatories(documentId: number): Promise<DocumentSignatory[]> {
    const document = await this.documentRepository.findOne({ 
        where: { id: documentId }, 
        relations: ['signatories', 'signatories.user'] 
    });
    if (!document || document.status !== DocumentStatus.SIGNING) {
      return [];
    }

    const pendingSignatories = document.signatories
      .filter(s => s.status === SignatoryStatus.PENDING)
      .sort((a, b) => a.order - b.order);

    if (pendingSignatories.length === 0) {
      return [];
    }

    const lowestOrder = pendingSignatories[0].order;

    // If lowest order is 0 (parallel), return all with order 0
    if (lowestOrder === 0) {
      return pendingSignatories.filter(s => s.order === 0);
    } 
    // If lowest order > 0 (sequential), return all with that lowest order
    else {
      return pendingSignatories.filter(s => s.order === lowestOrder);
    }
  }

  async updateSignatoryStatus(documentId: number, userId: number, newStatus: SignatoryStatus, rejectionReason?: string | null): Promise<void> {
    this.logger.log(`Updating signatory status for doc ID ${documentId}, user ID ${userId} to ${newStatus}`);
    const signatory = await this.signatoryRepository.findOne({ 
        where: { document: { id: documentId }, user: { id: userId } },
        relations: ['document', 'document.owner', 'user'] // Load relations needed later
    });

    if (!signatory) {
      throw new NotFoundException(`Signatário (usuário ${userId}) não encontrado para o documento ${documentId}.`);
    }
    if (!signatory.document) {
        throw new InternalServerErrorException(`Document relation missing for signatory ${signatory.id}`);
    }
    if (!signatory.user) {
        throw new InternalServerErrorException(`User relation missing for signatory ${signatory.id}`);
    }

    if (signatory.status !== SignatoryStatus.PENDING) {
      throw new BadRequestException(`Signatário (usuário ${userId}) não está com status PENDENTE.`);
    }

    // Check if it's the user's turn (re-check for safety)
    const isReady = await this.isDocumentReadyForUser(documentId, userId);
    if (!isReady) {
        throw new ForbiddenException(`Não é a vez deste usuário (${userId}) assinar o documento ${documentId}.`);
    }

    signatory.status = newStatus;
    if (newStatus === SignatoryStatus.SIGNED) {
      signatory.signedAt = new Date();
      signatory.rejectionReason = null;
    } else if (newStatus === SignatoryStatus.REJECTED) {
      signatory.rejectionReason = rejectionReason || 'Motivo não especificado';
      signatory.signedAt = null;
      // Update document status to REJECTED
      signatory.document.status = DocumentStatus.REJECTED;
      await this.documentRepository.save(signatory.document);
    }

    await this.signatoryRepository.save(signatory);
    this.logger.log(`Signatory status updated for user ${userId}, doc ${documentId}.`);

    // Log audit trail (Task 1.11)
    const action = newStatus === SignatoryStatus.SIGNED ? 'SIGN_DOCUMENT' : 'REJECT_DOCUMENT';
    await this.auditLogService.logAction(userId, action, 'DocumentSignatory', signatory.id, { documentId: documentId, reason: rejectionReason });

    // After updating status, check completion or notify next
    if (newStatus === SignatoryStatus.SIGNED) {
        const isComplete = await this.checkDocumentCompletion(documentId);
        if (!isComplete) {
            await this.notifyNextSignatories(documentId);
        }
    } else if (newStatus === SignatoryStatus.REJECTED) {
        // Notify owner and potentially others about rejection
        // Ensure document and user relations are loaded
        const fullDocument = await this.documentRepository.findOne({ where: { id: documentId }, relations: ['owner'] });
        if (fullDocument && signatory.user) {
            this.notificationService.notifyDocumentRejected(fullDocument, signatory.user, signatory.rejectionReason);
        }
    }
  }

  async checkDocumentCompletion(documentId: number): Promise<boolean> {
    this.logger.log(`Checking completion status for document ID: ${documentId}`);
    const document = await this.documentRepository.findOne({ 
        where: { id: documentId }, 
        relations: ['signatories', 'owner'] // Load owner for notification
    });

    if (!document || document.status !== DocumentStatus.SIGNING) {
      this.logger.log(`Document ID ${documentId} not found or not in SIGNING state.`);
      return false;
    }

    const allSigned = document.signatories.every(s => s.status === SignatoryStatus.SIGNED);

    if (allSigned) {
      this.logger.log(`Document ID ${documentId} is now complete.`);
      document.status = DocumentStatus.COMPLETED;
      await this.documentRepository.save(document);
      // Log audit trail (Task 1.11)
      await this.auditLogService.logAction(null, 'COMPLETE_DOCUMENT', 'Document', document.id);
      // Notify owner (and maybe signatories)
      this.notificationService.notifyDocumentCompleted(document);
      return true;
    } else {
      this.logger.log(`Document ID ${documentId} is not yet complete.`);
      return false;
    }
  }

  async notifyNextSignatories(documentId: number): Promise<void> {
    this.logger.log(`Determining next signatories to notify for document ID: ${documentId}`);
    const nextSignatories = await this.findNextSignatories(documentId);
    if (nextSignatories.length > 0) {
      this.logger.log(`Found ${nextSignatories.length} next signatories for document ID: ${documentId}. Notifying...`);
      // Ensure document relation is loaded for notification content
      const signatoriesWithDoc = await this.signatoryRepository.find({
          where: { id: In(nextSignatories.map(s => s.id)) },
          relations: ['document', 'user']
      });
      this.notificationService.notifySignatoriesDocumentReady(signatoriesWithDoc);
    } else {
        this.logger.log(`No pending signatories found to notify for document ID: ${documentId}. Checking completion again just in case.`);
        // It's possible the last signatory just signed, re-check completion
        await this.checkDocumentCompletion(documentId);
    }
  }
}

