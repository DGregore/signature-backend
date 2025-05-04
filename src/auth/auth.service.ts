import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UserService, UserPublicProfile } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../user/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { jwtConstants } from './constants/jwt.constants';
import { v4 as uuidv4 } from 'uuid'; // For generating unique refresh token identifiers if needed, or use raw token

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async validateUser(email: string, pass: string): Promise<UserPublicProfile | null> {
    const user = await this.userService.findByEmailWithPassword(email);
    if (user && await bcrypt.compare(pass, user.password)) {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        sector: user.sector,
      };
    }
    return null;
  }

  private async generateTokens(user: UserPublicProfile) {
    const accessTokenPayload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(accessTokenPayload, {
      secret: jwtConstants.secret,
      expiresIn: jwtConstants.expiresIn,
    });

    // Generate a unique, secure refresh token (e.g., UUID or crypto random bytes)
    // For simplicity, let's use a JWT as the refresh token itself, signed with a different secret
    const refreshTokenPayload = { sub: user.id }; // Keep payload minimal
    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: jwtConstants.refreshSecret,
      expiresIn: jwtConstants.refreshExpiresIn,
    });

    // Store the hashed refresh token in the database
    await this.storeRefreshToken(refreshToken, user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: user,
    };
  }

  private async storeRefreshToken(token: string, userId: number): Promise<void> {
    // Hash the token before storing
    const hashedToken = await bcrypt.hash(token, 10);
    const expiresAt = new Date();
    // Calculate expiry based on jwtConstants.refreshExpiresIn (e.g., '7d')
    // This requires parsing the string, a library like 'ms' could help, or manual parsing
    // Simple example for '7d':
    expiresAt.setDate(expiresAt.getDate() + 7); // Adjust based on actual expiresIn value

    // Revoke previous tokens for the user (optional, depends on strategy)
    await this.refreshTokenRepository.update({ userId: userId, isRevoked: false }, { isRevoked: true });

    // Create and save the new refresh token record
    const refreshTokenRecord = this.refreshTokenRepository.create({
      userId,
      hashedToken,
      expiresAt,
      isRevoked: false,
    });
    await this.refreshTokenRepository.save(refreshTokenRecord);
  }

  async login(user: UserPublicProfile) {
    return this.generateTokens(user);
  }

  async refreshToken(refreshTokenValue: string): Promise<{ access_token: string }> {
    try {
      // 1. Verify the refresh token signature and expiration using the refresh secret
      const payload = this.jwtService.verify(refreshTokenValue, {
        secret: jwtConstants.refreshSecret,
      });

      const userId = payload.sub;

      // 2. Find the stored token record in the database
      // We need to find the *unrevoked* token that matches the provided one.
      // Since we store hashes, we can't directly query by the token value.
      // Strategy: Find all unrevoked tokens for the user, then compare hashes.
      const storedTokens = await this.refreshTokenRepository.find({
        where: { userId: userId, isRevoked: false },
        order: { expiresAt: 'DESC' }, // Get the latest one first
      });

      let validStoredToken: RefreshToken | null = null;
      for (const storedToken of storedTokens) {
        if (await bcrypt.compare(refreshTokenValue, storedToken.hashedToken)) {
          validStoredToken = storedToken;
          break;
        }
      }

      // 3. Check if a valid, unrevoked token was found and if it's expired
      if (!validStoredToken) {
        throw new UnauthorizedException('Refresh token inválido ou revogado.');
      }
      if (validStoredToken.expiresAt < new Date()) {
        // Optionally revoke the expired token
        validStoredToken.isRevoked = true;
        await this.refreshTokenRepository.save(validStoredToken);
        throw new UnauthorizedException('Refresh token expirado.');
      }

      // 4. (Optional but recommended) Revoke the used refresh token to prevent reuse
      validStoredToken.isRevoked = true;
      await this.refreshTokenRepository.save(validStoredToken);

      // 5. Fetch the user profile
      const user = await this.userService.findOne(userId);
      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado.');
      }

      // 6. Generate a new access token (and optionally a new refresh token - rotation)
      // For simplicity, let's just generate a new access token here.
      // If implementing rotation, call generateTokens(user) instead.
      const accessTokenPayload = { email: user.email, sub: user.id, role: user.role };
      const newAccessToken = this.jwtService.sign(accessTokenPayload, {
        secret: jwtConstants.secret,
        expiresIn: jwtConstants.expiresIn,
      });

      return { access_token: newAccessToken };

    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Handle JWT errors (expired, invalid signature) as Unauthorized
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }
  }

  async revokeRefreshTokenForUser(userId: number): Promise<void> {
    await this.refreshTokenRepository.update({ userId: userId, isRevoked: false }, { isRevoked: true });
  }

}

