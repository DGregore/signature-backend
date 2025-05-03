import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { DocumentModule } from './document/document.module';
import { NotificationModule } from './notification/notification.module';
import { User } from './user/user.entity';
import { UserModule } from './user/user.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SectorModule } from './sector/sector.module';
import { Sector } from './sector/sector.entity';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Dg092131.!',
      database: 'signature_db',
      entities: [User, Sector],
      synchronize: true,
    }),
    UserModule,
    AuthModule,
    DocumentModule,
    SectorModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
