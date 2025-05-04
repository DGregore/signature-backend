import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module'; // Import UserModule to use UserService
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants/jwt.constants';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { TypeOrmModule } from '@nestjs/typeorm'; // Import TypeOrmModule
import { RefreshToken } from './entities/refresh-token.entity'; // Import RefreshToken entity

@Module({
  imports: [
    UserModule, // Make UserService available
    PassportModule, // Initialize Passport
    JwtModule.register({}), // Register JwtModule globally, configuration might be better here or async
    TypeOrmModule.forFeature([RefreshToken]), // Register RefreshToken repository
  ],
  providers: [
    AuthService,
    LocalStrategy, // Register LocalStrategy
    JwtStrategy,   // Register JwtStrategy
  ],
  controllers: [AuthController],
  exports: [AuthService], // Export AuthService if needed elsewhere
})
export class AuthModule {}

