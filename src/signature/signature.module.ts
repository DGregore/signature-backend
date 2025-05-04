import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Signature } from './signature.entity';
import { SignatureController } from './signature.controller';
import { SignatureService } from './signature.service';
import { DocumentModule } from '../document/document.module'; // Import DocumentModule
import { NotificationModule } from '../notification/notification.module'; // Import NotificationModule
import { AuditLogModule } from '../audit-log/audit-log.module'; // Import AuditLogModule
import { UserModule } from '../user/user.module'; // Import UserModule
import { DocumentSignatory } from '../document/document-signatory.entity'; // Import DocumentSignatory entity

@Module({
  imports: [
    TypeOrmModule.forFeature([Signature, DocumentSignatory]), // Add DocumentSignatory here
    DocumentModule, // Import DocumentModule to use DocumentService
    NotificationModule, // Import NotificationModule to use NotificationService
    AuditLogModule, // Import AuditLogModule to use AuditLogService
    UserModule // Import UserModule if needed (e.g., for user validation)
  ],
  controllers: [SignatureController],
  providers: [SignatureService],
  exports: [SignatureService]
})
export class SignatureModule {}

