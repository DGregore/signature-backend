import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config'; // Importar ConfigModule
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { Document } from './document.entity';
import { MinioService } from './minio.service'; // Importar MinioService

@Module({
  imports: [
    TypeOrmModule.forFeature([Document]),
    ConfigModule, // Importar ConfigModule para que MinioService possa usar ConfigService
  ],
  providers: [DocumentService, MinioService], // Adicionar MinioService aos providers
  controllers: [DocumentController],
  exports: [DocumentService, MinioService], // Exportar MinioService se necessário em outros módulos
})
export class DocumentModule {}

