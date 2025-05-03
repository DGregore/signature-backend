import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { SectorService } from './sector.service';
import { Sector } from './sector.entity';

@Controller('sectors')
export class SectorController {
  constructor(private readonly sectorService: SectorService) {}

  @Post()
  create(
    @Body('name') name: string,
    @Body('description') description: string,
  ): Promise<Sector> {
    return this.sectorService.create(name, description);
  }

  @Get()
  findAll(): Promise<Sector[]> {
    return this.sectorService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.sectorService.remove(id);
  }
}
