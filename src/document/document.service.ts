import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './document.entity';  // Importando a entidade Document

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,  // Injetando o repositório de Document
  ) {}

  // Método para buscar todos os documentos
  async findAll(): Promise<Document[]> {
    return this.documentRepository.find();
  }

  // Método para buscar um documento específico pelo ID
  async findOne(id: number): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id },
    });
    
    if (!document) {
      throw new Error(`Documento com id ${id} não encontrado.`);
    }

    return document;
  }

  // Método para criar um novo documento
  async create(name: string, description: string, file: Express.Multer.File): Promise<Document> {
    const document = this.documentRepository.create({ name, description, filePath: file.path });
    return this.documentRepository.save(document);
  }
}
