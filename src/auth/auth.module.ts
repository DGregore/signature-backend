import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [ 
      JwtModule.register({
        secret: '3uPZ!rA9*Fgk&2n%H7qL0#cXw@dE^sVYz$TbN+Jm',
        signOptions: { expiresIn: '1h'},
      }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
