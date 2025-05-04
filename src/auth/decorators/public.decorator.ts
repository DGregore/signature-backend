import { SetMetadata } from '@nestjs/common';

// Key to identify public routes
export const IS_PUBLIC_KEY = 'isPublic';

// Decorator to mark routes as public (accessible without JWT)
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

