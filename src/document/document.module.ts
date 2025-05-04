import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './document.entity';
import { DocumentSignatory } from './document-signatory.entity';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { MinioService } from './minio.service';
import { UserModule } from '../user/user.module'; // Assuming UserModule exists and exports UserService
import { NotificationModule } from '../notification/notification.module'; // Import NotificationModule
import { AuditLogModule } from '../audit-log/audit-log.module'; // Import AuditLogModule
import { User } from '../user/user.entity'; // Import User entity

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentSignatory, User]), // Add User here
    // UserModule, // Keep UserModule if DocumentService depends on UserService, otherwise remove
    NotificationModule, // Import NotificationModule to use NotificationService
    AuditLogModule // Import AuditLogModule to use AuditLogService
  ],
  controllers: [DocumentController],
  providers: [DocumentService, MinioService],
  exports: [DocumentService, MinioService] // Export MinioService if needed elsewhere
})
export class DocumentModule {}

