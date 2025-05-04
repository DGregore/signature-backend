import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity'; // Import UserRole
import { Sector } from '../sector/sector.entity'; // Import Sector
import { SectorService } from '../sector/sector.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Define the type for the user without the password and helper methods
// Ensure this type includes all relevant public fields from User, excluding methods and password
export type UserPublicProfile = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  sector: Sector | null; // Match the entity type
};

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private sectorService: SectorService,
  ) {}

  // Helper function to map User entity to UserPublicProfile
  private userToPublicProfile(user: User): UserPublicProfile {
    // Explicitly map fields to ensure correct type and exclude unwanted properties
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      sector: user.sector, // sector is already Sector | null
    };
  }

  // Helper function to map User array to UserPublicProfile array
  private usersToPublicProfile(users: User[]): UserPublicProfile[] {
    return users.map(user => this.userToPublicProfile(user));
  }

  async create(createUserDto: CreateUserDto): Promise<UserPublicProfile> {
    const { name, email, password, sectorId, role } = createUserDto;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Email já cadastrado.');
    }

    let sectorEntity: Sector | null = null; // Use a different variable name to avoid confusion
    if (sectorId) {
        try {
            sectorEntity = await this.sectorService.findOne(sectorId);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new BadRequestException(`Setor com ID ${sectorId} não encontrado.`);
            } else {
                throw error; // Re-throw other errors
            }
        }
    }

    // Hashing is handled by @BeforeInsert hook in user.entity.ts
    // Ensure the object passed to create matches DeepPartial<User>
    const user = this.userRepository.create({
        name,
        email,
        password, // Pass plain password, hook will hash it
        // TypeORM should handle Sector | null correctly here now
        sector: sectorEntity,
        role: role || UserRole.USER,
    });

    // Save the user entity
    const savedUser: User = await this.userRepository.save(user);

    // Use helper to map to public profile before returning
    // Ensure savedUser is correctly typed as User, not User[]
    return this.userToPublicProfile(savedUser);
  }

  async findAll(): Promise<UserPublicProfile[]> {
    // Password is not selected by default due to `select: false` in entity
    const users = await this.userRepository.find({
        relations: ['sector'], // Load the sector relation
    });
    // Use helper to map to public profile array
    return this.usersToPublicProfile(users);
  }

  async findOne(id: number): Promise<UserPublicProfile> {
    // Password is not selected by default
    const user = await this.userRepository.findOne({
        where: { id },
        relations: ['sector'], // Load the sector relation
    });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }
    // Use helper to map to public profile
    return this.userToPublicProfile(user);
  }

  // Used internally for authentication, needs to return the full User entity with password
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.createQueryBuilder('user')
        .addSelect('user.password') // Explicitly select the password
        .leftJoinAndSelect('user.sector', 'sector') // Load sector relation
        .where('user.email = :email', { email })
        .getOne();
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserPublicProfile> {
    // Fetch user including password to allow saving and password comparison if needed
    const user = await this.userRepository.createQueryBuilder('user')
        .addSelect('user.password')
        .leftJoinAndSelect('user.sector', 'sector') // Also load sector relation
        .where('user.id = :id', { id })
        .getOne();

    if (!user) {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }

    const { name, email, password, sectorId, role } = updateUserDto;

    if (email && email !== user.email) {
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser && existingUser.id !== id) {
            throw new BadRequestException('Email já cadastrado por outro usuário.');
        }
        user.email = email;
    }

    // Handle sector update - allow setting to null or a valid sector
    if (sectorId !== undefined) { // Check if sectorId was provided in the DTO
        if (sectorId === null) {
            user.sector = null; // Assign null directly (type is Sector | null)
        } else {
            try {
                const sector = await this.sectorService.findOne(sectorId);
                user.sector = sector; // Assign the found Sector entity
            } catch (error) {
                if (error instanceof NotFoundException) {
                    throw new BadRequestException(`Setor com ID ${sectorId} não encontrado.`);
                } else {
                    throw error; // Re-throw other errors
                }
            }
        }
    }

    if (name) user.name = name;
    if (role) user.role = role;

    // Hash the new password only if it was provided
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    // Save changes
    const savedUser: User = await this.userRepository.save(user);

    // Use helper to map to public profile before returning
    return this.userToPublicProfile(savedUser);
  }

  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }
  }
}

