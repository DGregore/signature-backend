export const jwtConstants = {
  // TODO: Move these to environment variables for production!
  secret: process.env.JWT_SECRET || 'DEFAULT_VERY_SECRET_KEY_CHANGE_ME',
  expiresIn: process.env.JWT_EXPIRES_IN || '3600s', // Default to 1 hour (access token)

  refreshSecret: process.env.JWT_REFRESH_SECRET || 'DEFAULT_VERY_SECRET_REFRESH_KEY_CHANGE_ME_TOO',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // Default to 7 days (refresh token)
};

