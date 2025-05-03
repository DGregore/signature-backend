import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { SectorModule } from '../sector/sector.module'; // Importando o SectorModule

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Registrando o repositório de Usuário
    SectorModule, // Importando o SectorModule para ter acesso ao SectorService
  ],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
