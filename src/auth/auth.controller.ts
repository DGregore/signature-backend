import { Controller, Request, Post, UseGuards, Body, HttpCode, HttpStatus, Get } from '@nestjs/common'; // Import Get
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserPublicProfile } from '../user/user.service';
// JwtAuthGuard is applied globally, no need to import/use it here unless overriding

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public() // Login endpoint is public
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: { user: UserPublicProfile }, @Body() loginDto: LoginDto) {
    // req.user is populated by LocalStrategy
    return this.authService.login(req.user);
  }

  @Public() // Refresh endpoint is public
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  // Protected route to get the profile of the currently logged-in user
  // JwtAuthGuard is applied globally, so this route is protected by default
  @Get('profile')
  getProfile(@Request() req: { user: UserPublicProfile }) {
    // req.user is populated by JwtStrategy's validate method
    return req.user;
  }

  // Example: Endpoint to explicitly revoke tokens (logout)
  // This would require the user to be authenticated with an access token
  // @Post('logout')
  // @HttpCode(HttpStatus.OK)
  // async logout(@Request() req: { user: UserPublicProfile }) {
  //   await this.authService.revokeRefreshTokenForUser(req.user.id);
  //   return { message: 'Logout successful' };
  // }
}

