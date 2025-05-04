import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  FileTypeValidator,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { MinioService } from './minio.service';
import { Express } from 'express'; // Import Express
import { Multer } from 'multer'; // Correct import for Multer
import { v4 as uuidv4 } from 'uuid'; // For generating unique filenames
import * as path from 'path';

@Controller('api/documents') // Prefixing with /api for consistency
export class DocumentController {
  private readonly logger = new Logger(DocumentController.name);

  constructor(
    private documentService: DocumentService,
    private minioService: MinioService,
  ) {}

  // Rota para upload de um novo documento PDF para o MinIO
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file')) // Use memory storage by default if no storage option is provided
  async uploadDocument(
    @Body('name') name: string, // Extract name and description from body
    @Body('description') description: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // new MaxFileSizeValidator({ maxSize: 10000000 }), // Example: Limit size to 10MB
          new FileTypeValidator({ fileType: 'application/pdf' }), // Validate if it's a PDF
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    this.logger.log(`Received file upload request: ${file.originalname}, size: ${file.size}, mimetype: ${file.mimetype}`);
    if (!name) {
        name = path.parse(file.originalname).name; // Use original filename without extension if name is not provided
    }
    if (!description) {
        description = ''; // Default description if not provided
    }

    // Generate a unique filename for MinIO to avoid collisions
    const uniqueFileName = `${uuidv4()}${path.extname(file.originalname)}`;

    try {
      // Upload to MinIO
      const uploadResult = await this.minioService.uploadFile(
        uniqueFileName,
        file.buffer,
        file.mimetype,
      );
      this.logger.log(`File uploaded to MinIO. ETag: ${uploadResult.etag}, Filename: ${uniqueFileName}`);

      // TODO: Save document metadata (name, description, uniqueFileName, etag, etc.) to PostgreSQL via DocumentService
      // Example (assuming DocumentService.create is adapted):
      // const document = await this.documentService.create(name, description, uniqueFileName, uploadResult.etag, file.mimetype, file.size);

      return {
        message: 'File uploaded successfully!',
        fileName: uniqueFileName,
        originalName: file.originalname,
        etag: uploadResult.etag,
        // documentId: document.id // Return document ID after saving to DB
      };
    } catch (error) {
      this.logger.error(`Failed to upload file ${file.originalname}: ${error.message}`, error.stack);
      // Consider throwing a more specific HTTP exception
      throw error;
    }
  }

  // Rota para listar todos os documentos (metadata from DB)
  @Get()
  async findAll() {
    // TODO: Implement fetching document list from DocumentService (which queries the DB)
    // return await this.documentService.findAll();
    this.logger.log('Fetching all documents metadata...');
    return { message: 'List functionality not yet implemented.' };
  }

  // Rota para buscar metadados de um documento específico (from DB)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    // TODO: Implement fetching specific document metadata from DocumentService
    // return await this.documentService.findOne(parseInt(id, 10));
    this.logger.log(`Fetching metadata for document ID: ${id}...`);
    return { message: `Find one functionality for ID ${id} not yet implemented.` };
  }

  // TODO: Add endpoint for downloading a document from MinIO
  // TODO: Add endpoint for deleting a document (metadata from DB and file from MinIO)
}

