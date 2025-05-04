import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, ValidationPipe, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity'; // Importar User entity

@Controller('api/users') // Ajustado para /api/users para corresponder ao frontend
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> { // Retorna sem senha
    const user = await this.userService.create(createUserDto);
    const { password, ...result } = user; // Remove a senha do objeto retornado
    return result;
  }

  @Get()
  async findAll(): Promise<Omit<User, 'password'>[]> { // Retorna sem senha
    // O service já retorna sem senha
    return this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Omit<User, 'password'>> { // Retorna sem senha
     // O service já retorna sem senha
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, skipMissingProperties: true }))
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto): Promise<Omit<User, 'password'>> { // Retorna sem senha
    // O service já retorna sem senha
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.userService.remove(id);
  }

  // TODO: Adicionar endpoints de login, registro, perfil se ainda não existirem em AuthController
}

