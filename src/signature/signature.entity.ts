import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { Document } from '../document/document.entity';
import { User } from '../user/user.entity';

@Entity('signatures') // Explicit table name
@Index(["document", "user"]) // Index for querying signatures by document and user
export class Signature {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Document, (document) => document.signatures, { nullable: false, onDelete: 'CASCADE' })
  document: Document;

  @ManyToOne(() => User, { nullable: false, eager: false }) // The user who provided the signature
  user: User;

  @Column({ type: 'text' }) // Store signature data (e.g., Base64 string, SVG, JSON for vector data)
  signatureData: string;

  @Column({ type: 'jsonb', nullable: true }) // Store position data (page, x, y)
  positionData: { page: number; x: number; y: number } | null;

  @CreateDateColumn()
  timestamp: Date; // Timestamp of when the signature was recorded
}

