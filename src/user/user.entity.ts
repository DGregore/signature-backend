import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, BeforeInsert, BeforeUpdate, Index } from 'typeorm';
import { Sector } from '../sector/sector.entity';
import * as bcrypt from 'bcrypt';

// Define possible roles
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Entity('users') // Explicit table name
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column({ select: false }) // Prevent password from being selected by default
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER, // Default role is 'user'
  })
  role: UserRole;

  // Sector can be optional, don't eager load by default
  // Explicitly allow null for TypeScript type safety
  @ManyToOne(() => Sector, (sector) => sector.id, { nullable: true, eager: false })
  sector: Sector | null;

  // Hash password before inserting
  @BeforeInsert()
  async hashPasswordBeforeInsert() {
    if (this.password) {
      const saltRounds = 10; // Standard salt rounds
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }

  // Hash password before updating, only if it's changed
  @BeforeUpdate()
  async hashPasswordBeforeUpdate() {
    // Rely on the service layer to handle hashing on update for more control.
  }

  // Method to compare password (useful in service layer)
  async comparePassword(attempt: string): Promise<boolean> {
    // We need the password hash loaded for this comparison.
    // The service layer will need to explicitly select the password field.
    return bcrypt.compare(attempt, this.password);
  }
}

