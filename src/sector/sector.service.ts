import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sector } from './sector.entity';
import { CreateSectorDto } from './dto/create-sector.dto'; // Criaremos este DTO
import { UpdateSectorDto } from './dto/update-sector.dto'; // Criaremos este DTO

@Injectable()
export class SectorService {
  constructor(
    @InjectRepository(Sector)
    private sectorRepository: Repository<Sector>,
  ) {}

  async create(createSectorDto: CreateSectorDto): Promise<Sector> {
    const { name } = createSectorDto; // Extrai apenas o nome do DTO

    // Opcional: Verificar se setor com mesmo nome já existe
    const existingSector = await this.sectorRepository.findOne({ where: { name } });
    if (existingSector) {
      throw new BadRequestException(`Setor com nome "${name}" já existe.`);
    }

    const sector = this.sectorRepository.create({ name }); // Cria a entidade apenas com o nome
    return this.sectorRepository.save(sector);
  }

  async findAll(): Promise<Sector[]> {
    return this.sectorRepository.find();
  }

  async findOne(id: number): Promise<Sector> {
    const sector = await this.sectorRepository.findOne({ where: { id } });
    if (!sector) {
      throw new NotFoundException(`Setor com ID ${id} não encontrado.`);
    }
    return sector;
  }

  async update(id: number, updateSectorDto: UpdateSectorDto): Promise<Sector> {
    // Busca o setor existente ou lança NotFoundException
    const sector = await this.findOne(id);

    const { name } = updateSectorDto;

    // Opcional: Verificar se o novo nome já está em uso por outro setor
    if (name && name !== sector.name) {
        const existingSector = await this.sectorRepository.findOne({ where: { name } });
        if (existingSector) {
            throw new BadRequestException(`Setor com nome "${name}" já existe.`);
        }
    }

    // Atualiza o nome se fornecido
    if (name) {
        sector.name = name;
    }

    // Salva as alterações
    return this.sectorRepository.save(sector);
  }

  async remove(id: number): Promise<void> {
    const result = await this.sectorRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Setor com ID ${id} não encontrado.`);
    }
  }
}

