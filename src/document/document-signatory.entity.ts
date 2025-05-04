import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Document } from './document.entity';
import { User } from '../user/user.entity';

// Enum for Signatory Status
export enum SignatoryStatus {
  PENDING = 'PENDING',
  SIGNED = 'SIGNED',
  REJECTED = 'REJECTED',
}

@Entity('document_signatories') // Explicit table name
@Index(["document", "user"], { unique: true }) // Prevent adding the same user multiple times to the same document
@Index(["document", "order"]) // Index for finding next signatory by order
export class DocumentSignatory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Document, (document) => document.signatories, { nullable: false, onDelete: 'CASCADE' }) // Cascade delete if document is deleted
  document: Document;

  @ManyToOne(() => User, { nullable: false, eager: false }) // Signatory user
  user: User;

  @Column({ type: 'int', default: 0 }) // 0 for parallel, >0 for sequential order
  order: number;

  @Column({
    type: 'enum',
    enum: SignatoryStatus,
    default: SignatoryStatus.PENDING,
  })
  status: SignatoryStatus;

  @Column({ type: 'timestamp', nullable: true })
  signedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

