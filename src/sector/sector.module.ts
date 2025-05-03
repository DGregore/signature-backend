import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SectorService } from './sector.service';
import { SectorController } from './sector.controller';
import { Sector } from './sector.entity'; // Importando a entidade de setor

@Module({
  imports: [TypeOrmModule.forFeature([Sector])], // Registrando o repositório de Setores
  providers: [SectorService], // Injetando o SectorService
  controllers: [SectorController], // Injetando o controlador de Setores
  exports: [SectorService], // Exportando o SectorService para outros módulos
})
export class SectorModule {}
