import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';  // Importando TypeOrmModule
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { Document } from './document.entity';  // Importando a entidade Document

@Module({
  imports: [TypeOrmModule.forFeature([Document])],  // Registrando o repositório Document
  providers: [DocumentService],
  controllers: [DocumentController],
  exports: [DocumentService],  // Exportando o DocumentService se necessário
})
export class DocumentModule {}
