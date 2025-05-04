import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { User } from '../user/user.entity';

@Entity('audit_logs') // Explicit table name
@Index(["entityType", "entityId"]) // Index for querying logs by entity
@Index(["user"]) // Index for querying logs by user
@Index(["action"]) // Index for querying logs by action
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  timestamp: Date;

  // User who performed the action (nullable for system actions)
  @ManyToOne(() => User, { nullable: true, eager: false })
  user: User | null;

  @Column() // e.g., CREATE_DOCUMENT, VIEW_DOCUMENT, SIGN_DOCUMENT, LOGIN_SUCCESS, USER_CREATED
  action: string;

  @Column({ type: 'varchar', nullable: true }) // Explicitly set type to varchar (or text)
  entityType: string | null;

  @Column({ type: 'int', nullable: true }) // ID of the related entity
  entityId: number | null;

  @Column({ type: 'jsonb', nullable: true }) // Store additional details like IP address, user agent, changed fields, etc.
  details: any | null;
}

