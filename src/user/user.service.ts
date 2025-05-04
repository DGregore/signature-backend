import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { SectorService } from '../sector/sector.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Definindo um tipo para o usuário sem a senha
type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private sectorService: SectorService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { name, email, password, sectorId } = createUserDto;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Email já cadastrado.');
    }

    const sector = await this.sectorService.findOne(sectorId);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({ 
        name,
        email,
        password: hashedPassword, 
        sector 
    });
    // O save retorna a entidade completa, incluindo a senha hash
    return this.userRepository.save(user);
  }

  async findAll(): Promise<UserWithoutPassword[]> {
    // Usando select para garantir que a senha não seja buscada do BD
    return this.userRepository.find({ 
        relations: ['sector'], 
        select: {
            id: true,
            name: true,
            email: true,
            sector: {
                id: true,
                name: true
            }
        }
     });
  }

  async findOne(id: number): Promise<UserWithoutPassword> {
    // Usando select para garantir que a senha não seja buscada do BD
    const user = await this.userRepository.findOne({ 
        where: { id }, 
        relations: ['sector'], 
        select: {
            id: true,
            name: true,
            email: true,
            sector: {
                id: true,
                name: true
            }
        }
    });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }
    return user;
  }

  // Usado internamente para autenticação, retorna com senha
  async findByEmail(email: string): Promise<User | null> { 
    return this.userRepository.findOne({ where: { email }, relations: ['sector'] });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserWithoutPassword> {
    // Busca o usuário existente (incluindo a senha para poder salvar depois)
    const user = await this.userRepository.findOne({ where: { id }, relations: ['sector'] });
    if (!user) {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }

    const { name, email, password, sectorId } = updateUserDto;

    if (email && email !== user.email) {
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new BadRequestException('Email já cadastrado por outro usuário.');
        }
        user.email = email;
    }

    if (sectorId !== undefined && sectorId !== user.sector?.id) {
        const sector = await this.sectorService.findOne(sectorId);
        user.sector = sector;
    }

    if (name) user.name = name;

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    // Salva as alterações
    const savedUser = await this.userRepository.save(user);
    
    // Cria um novo objeto sem a senha para retornar ao cliente
    const { password: removedPassword, ...result } = savedUser;
    return result;
  }

  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }
  }
}

