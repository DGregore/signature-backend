import { Controller, Post, Get, Param, Body, UploadedFile } from '@nestjs/common';
import { DocumentService } from './document.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors } from '@nestjs/common';
import { diskStorage } from 'multer';
import * as path from 'path';
import { Multer } from 'multer';

@Controller('documents')
export class DocumentController {
  constructor(private documentService: DocumentService) {}

  // Rota para criar um novo documento com upload
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads', // Diretório para salvar os arquivos
      filename: (req, file, callback) => {
        callback(null, Date.now() + path.extname(file.originalname)); // Nome do arquivo com timestamp
      }
    })
  }))
  async uploadDocument(@Body() body, @UploadedFile() file: Express.Multer.File) {
    const { name, description } = body;
    return await this.documentService.create(name, description, file);
  }

  // Rota para listar todos os documentos
  @Get()
  async findAll() {
    return await this.documentService.findAll();
  }

  // Rota para buscar um documento específico
  @Get(':id')
  async findOne(@Param('id') id: number) {
    return await this.documentService.findOne(id);
  }
}
