import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
  Param, // Import Param decorator
} from "@nestjs/common";
import { Optional } from "@nestjs/common"; // Import Optional
import { AuditLogService } from "./audit-log.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"; // Assuming JWT guard exists
import { RolesGuard } from "../auth/guards/roles.guard"; // Assuming Roles guard exists
import { Roles } from "../auth/decorators/roles.decorator"; // Assuming Roles decorator exists
import { UserRole } from "../user/user.entity"; // Adjust path
import { FindManyOptions } from "typeorm";
import { AuditLog } from "./audit-log.entity";
import { Type } from "class-transformer"; // Import Type
import { IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator"; // Import necessary validators

// DTO for query parameters
class FindAuditLogsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  entityId?: number;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number = 100; // Default limit

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0; // Default offset
}

@Controller("audit-logs")
@UseGuards(JwtAuthGuard, RolesGuard) // Protect endpoints
@Roles(UserRole.ADMIN) // Only Admins can access audit logs
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async findLogs(
    // Use ValidationPipe to enable DTO transformation and validation
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: FindAuditLogsQueryDto,
  ): Promise<AuditLog[]> {
    const { userId, entityType, entityId, action, take, skip } = query;

    const options: FindManyOptions<AuditLog> = {
      where: {},
      take: take,
      skip: skip,
      order: { timestamp: "DESC" }, // Default order
      relations: ["user"], // Include user details
    };

    if (userId !== undefined) { // Check for undefined as 0 is a valid ID
      options.where = { ...options.where, user: { id: userId } };
    }
    if (entityType) {
      options.where = { ...options.where, entityType: entityType };
    }
    if (entityId !== undefined) {
      options.where = { ...options.where, entityId: entityId };
    }
    if (action) {
      options.where = { ...options.where, action: action };
    }

    return this.auditLogService.findLogs(options);
  }

  @Get("entity/:entityType/:entityId")
  async findLogsForEntity(
    @Param("entityType") entityType: string,
    @Param("entityId", new ParseIntPipe()) entityId: number, // Use new ParseIntPipe() here for path param
  ): Promise<AuditLog[]> {
    return this.auditLogService.findLogsForEntity(entityType, entityId);
  }
}

