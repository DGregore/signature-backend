import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { SectorModule } from '../sector/sector.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    SectorModule,
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService] // <--- Adicione esta linha
})
export class UserModule {}
