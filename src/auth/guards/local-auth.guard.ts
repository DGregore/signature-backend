import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// This guard automatically uses the strategy named 'local' (our LocalStrategy)
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}

