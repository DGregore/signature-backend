import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { jwtConstants } from '../constants/jwt.constants';
import { UserService } from '../../user/user.service'; // Assuming UserService can find user by ID or email

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Standard way to extract JWT from Authorization header
      ignoreExpiration: false, // Ensure expired tokens are rejected
      secretOrKey: jwtConstants.secret, // Use the same secret key
    });
  }

  // Passport automatically verifies the token signature and expiration
  // It then calls this method with the decoded payload
  async validate(payload: any) {
    // Payload contains { email: user.email, sub: user.id, role: user.role }
    // We can use the 'sub' (subject, which is user ID) to fetch the user
    // This ensures the user still exists and allows fetching fresh user data
    const user = await this.userService.findOne(payload.sub); // Use findOne which returns UserPublicProfile

    if (!user) {
      // Although the token was valid, the user might have been deleted
      throw new UnauthorizedException('Usuário não encontrado ou token inválido.');
    }

    // We could add more checks here, e.g., if the user's role changed

    // The returned object will be attached to request.user
    // Return the public profile (already fetched by findOne)
    return user;
  }
}

