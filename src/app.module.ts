import { Module, ValidationPipe } from '@nestjs/common'; // Import ValidationPipe
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core'; // Import APP_GUARD and APP_PIPE
import { AuthModule } from './auth/auth.module';
import { DocumentModule } from './document/document.module';
import { NotificationModule } from './notification/notification.module';
import { User } from './user/user.entity';
import { UserModule } from './user/user.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SectorModule } from './sector/sector.module';
import { Sector } from './sector/sector.entity';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'; // Import JwtAuthGuard
import { Document } from './document/document.entity'; // Import Document entity
import { DocumentSignatory } from './document/document-signatory.entity'; // Import DocumentSignatory entity
import { RefreshToken } from './auth/entities/refresh-token.entity'; // Import RefreshToken entity
import { SignatureModule } from './signature/signature.module'; // Import SignatureModule
import { Signature } from './signature/signature.entity'; // Import Signature entity
import { AuditLogModule } from './audit-log/audit-log.module'; // Import AuditLogModule
import { AuditLog } from './audit-log/audit-log.entity'; // Import AuditLog entity

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', '144.126.136.132'), // Use provided host or default
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'), // Use provided user or default
        password: configService.get<string>('DB_PASSWORD', 'dg!!#!((%$'), // Use provided password or default
        database: configService.get<string>('DB_DATABASE', 'signature_db'),
        entities: [
          User,
          Sector,
          Document,
          DocumentSignatory, // Add DocumentSignatory entity
          RefreshToken,
          Signature, // Add Signature entity
          AuditLog, // Add AuditLog entity
        ],
        synchronize: configService.get<string>('NODE_ENV', 'development') !== 'production',
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    DocumentModule,
    SignatureModule, // Add SignatureModule
    SectorModule,
    NotificationModule,
    AuditLogModule, // Add AuditLogModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply JwtAuthGuard globally to all routes
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Apply ValidationPipe globally to validate DTOs
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true, // Strip properties not defined in DTO
        forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
        transform: true, // Automatically transform payloads to DTO instances
      }),
    },
  ],
})
export class AppModule {}

