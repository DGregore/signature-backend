import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sector } from './sector.entity';

@Injectable()
export class SectorService {
  constructor(
    @InjectRepository(Sector)
    private sectorRepository: Repository<Sector>,
  ) {}

  // Método para buscar todos os setores
  async findAll(): Promise<Sector[]> {
    return this.sectorRepository.find();
  }

  // Método para buscar um setor específico pelo ID
  async findOne(id: number): Promise<Sector> {
    const sector = await this.sectorRepository.findOne({ where: { id } }); // Usando FindOneOptions com where
    if (!sector) {
      throw new Error(`Setor com id ${id} não encontrado.`);
    }
    return sector;
  }

  // Criar setor
  async create(name: string, description: string): Promise<Sector> {
    const sector = this.sectorRepository.create({ name, description });
    return this.sectorRepository.save(sector);
  }

  // Deletar setor
  async remove(id: number): Promise<void> {
    await this.sectorRepository.delete(id);
  }
}
