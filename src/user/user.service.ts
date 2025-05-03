import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { SectorService } from '../sector/sector.service'; // Importar o setor corretamente

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private sectorService: SectorService, // Injetar o serviço de setor corretamente
  ) {}

  // Criar usuário
  async create(name: string, email: string, password: string, sectorId: number): Promise<User> {
    const sector = await this.sectorService.findOne(sectorId); // Agora chama findOne do setor corretamente
    const user = this.userRepository.create({ name, email, password, sector });
    return this.userRepository.save(user);
  }

  // Listar usuários
  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: ['sector'] });
  }
}
