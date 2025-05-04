import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service'; // Corrected path
import { LoginDto } from '../dto/login.dto'; // Corrected path

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, pass: string): Promise<any> {
    const user = await this.authService.validateUser(email, pass);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    // AuthService.validateUser now returns UserPublicProfile (or null)
    // No need to destructure password here, it's already excluded
    return user; // This will be available as req.user
  }
}

