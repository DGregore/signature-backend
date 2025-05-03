import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Sector } from '../sector/sector.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @ManyToOne(() => Sector, (sector) => sector.id)
  sector: Sector;
}
