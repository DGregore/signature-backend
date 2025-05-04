import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { User } from '../../user/user.entity'; // Corrected path

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Index()
  @Column()
  userId: number; // Foreign key to User

  @Column()
  hashedToken: string;

  @Column({ type: 'timestamp with time zone' })
  expiresAt: Date;

  @Column({ default: false })
  isRevoked: boolean;
}

