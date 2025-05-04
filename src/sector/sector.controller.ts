import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, ValidationPipe, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { SectorService } from './sector.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';
import { Sector } from './sector.entity';

@Controller('api/sectors') // Ajustado para /api/sectors para corresponder ao frontend
export class SectorController {
  constructor(private readonly sectorService: SectorService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createSectorDto: CreateSectorDto): Promise<Sector> {
    return this.sectorService.create(createSectorDto);
  }

  @Get()
  findAll(): Promise<Sector[]> {
    return this.sectorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Sector> {
    return this.sectorService.findOne(id);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, skipMissingProperties: true }))
  update(@Param('id', ParseIntPipe) id: number, @Body() updateSectorDto: UpdateSectorDto): Promise<Sector> {
    return this.sectorService.update(id, updateSectorDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.sectorService.remove(id);
  }
}

