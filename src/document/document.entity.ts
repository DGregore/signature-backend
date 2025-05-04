import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../user/user.entity'; // Assuming User entity path

// Enum for Document Status
export enum DocumentStatus {
  PENDING = 'PENDING', // Initial state, before processing signatories
  SIGNING = 'SIGNING', // Ready for or currently in the signing process
  COMPLETED = 'COMPLETED', // All required signatures obtained
  CANCELED = 'CANCELED', // Flow was canceled
  REJECTED = 'REJECTED', // A signatory rejected the document
}

@Entity('documents') // Explicit table name
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true }) // Allow null if title is optional
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  originalFilename: string; // Original name of the uploaded file

  @Column()
  storagePath: string; // Path/key in MinIO/S3

  @Column()
  mimeType: string; // e.g., 'application/pdf'

  @Column()
  size: number; // File size in bytes

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  // Relation to the user who uploaded/owns the document
  @ManyToOne(() => User, { nullable: false, eager: false }) // Owner is mandatory
  owner: User;

  // Relation to signatories (defined in DocumentSignatory entity)
  @OneToMany(() => DocumentSignatory, (signatory) => signatory.document)
  signatories: DocumentSignatory[];

  // Relation to signatures (defined in Signature entity)
  @OneToMany(() => Signature, (signature) => signature.document)
  signatures: Signature[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Remove old fields
  // @Column()
  // filePath: string;

  // @Column({ nullable: true })
  // signDate: Date;

  // @Column({ nullable: true })
  // signers: string;
}

// Need to define DocumentSignatory and Signature entities as well
// Placeholder imports - these files need to be created
import { DocumentSignatory } from './document-signatory.entity';
import { Signature } from '../signature/signature.entity'; // Assuming signature module path

