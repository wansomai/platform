// src/lib/auth/constants.ts
export const JWT_SECRET:string =process.env.JWT_SECRET|| "";
export const JWT_EXPIRES_IN = '1h';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "";
export const JWT_REFRESH_EXPIRES_IN = '7d';

// Cookie settings
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/'
};