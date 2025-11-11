// src/lib/auth/token-service.ts
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN } from './constants';

import { User } from 'next-auth'; 

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  organization: {
    id: string;
    name: string;
  };
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT access token with consistent user data structure
 */
export const generateAccessToken = (user: User): string => {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    name: user.name || user.fullName || '',
    role: user.role || 'user', 
    organizationId: user.organizationId || '', 
    organization: user.organization || { id: '', name: '' } 
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Generate a JWT refresh token with consistent user data structure
 */
export const generateRefreshToken = (user: User): string => {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    name: user.name || user.fullName || '',
    role:user.role || 'user',
    organizationId: user.organizationId || '',
    organization:user.organization || { id: '', name: '' }
  };
  
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

/**
 * Generate both tokens with a consistent structure
 */
export const generateTokens = (user: User) => {
  return {
    access_token: generateAccessToken(user),
    refresh_token: generateRefreshToken(user)
  };
};

