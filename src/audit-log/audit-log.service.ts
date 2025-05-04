import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { User } from '../user/user.entity'; // Adjust path

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Logs an action performed in the system.
   *
   * @param userId The ID of the user performing the action (null for system actions).
   * @param action A string identifier for the action (e.g., 'CREATE_DOCUMENT', 'SIGN_DOCUMENT').
   * @param entityType The type of entity affected (e.g., 'Document', 'Signature').
   * @param entityId The ID of the entity affected.
   * @param details Optional additional details about the action (e.g., rejection reason).
   */
  async logAction(
    userId: number | null,
    action: string,
    entityType: string,
    entityId: number,
    details?: Record<string, any>,
  ): Promise<void> { // Changed return type to Promise<void>
    this.logger.log(
      `Logging action: User ${userId || 'System'} performed ${action} on ${entityType} ${entityId}`,
    );
    try {
      const logEntry = this.auditLogRepository.create({
        user: userId ? { id: userId } : null,
        action: action,
        entityType: entityType,
        entityId: entityId,
        details: details || {},
        // timestamp is handled by @CreateDateColumn
      });
      await this.auditLogRepository.save(logEntry); // Save the log entry
      // Removed return statement
    } catch (error) {
      this.logger.error(
        `Failed to save audit log for action ${action} on ${entityType} ${entityId}: ${error.message}`,
        error.stack,
      );
      // Decide whether to re-throw or just log the error
      // Not throwing allows the main operation to succeed even if logging fails
      // Removed 'return null;'
    }
  }

  /**
   * Finds audit logs based on provided options (e.g., filtering by user, entity, action).
   * Primarily for admin use.
   */
  async findLogs(options?: FindManyOptions<AuditLog>): Promise<AuditLog[]> {
    this.logger.log(`Finding audit logs with options: ${JSON.stringify(options)}`);
    // Add permission checks if necessary
    return this.auditLogRepository.find({
      ...options,
      relations: ['user'], // Load user relation
      order: { timestamp: 'DESC' }, // Default order: newest first
    });
  }

  /**
   * Finds audit logs related to a specific entity.
   */
  async findLogsForEntity(entityType: string, entityId: number): Promise<AuditLog[]> {
    return this.findLogs({ where: { entityType, entityId } });
  }
}

