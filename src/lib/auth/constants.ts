// src/lib/auth/constants.ts
// In production, this should be an environment variable
export const JWT_SECRET = "23cc5f842ca52345400e310985223cbd92444fba095df1bb9cf0f94a3fb6f9acc7b178a9aa8743db278c5d049946941e33099a15663cd45186c38028c87ed227";
export const JWT_EXPIRES_IN = '1h';
export const JWT_REFRESH_SECRET = "23cc5f842ca52345400e310985223cbd92444fba095df1bb9cf0f94a3fb6f9acc7b178a9aa8743db278c5d049946941e33099a15663cd45186c38028c87ed227";
export const JWT_REFRESH_EXPIRES_IN = '7d';

// Cookie settings
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/'
};