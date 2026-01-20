// src/config/jwt.ts
import { JWT, JWTDecodeParams, JWTEncodeParams } from 'next-auth/jwt';
import * as jose from 'jose';

// JWT secret must be provided via environment variable
const getJwtSecret = (): Uint8Array => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET environment variable is required');
  }
  return new TextEncoder().encode(secret);
};

// Lazy initialization to allow environment to be loaded
let _encodedSecret: Uint8Array | null = null;
const getEncodedSecret = (): Uint8Array => {
  if (!_encodedSecret) {
    _encodedSecret = getJwtSecret();
  }
  return _encodedSecret;
};

const encode = async (params: JWTEncodeParams): Promise<string> => {
  const signedToken = await new jose.SignJWT(params.token as Record<string, any>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h') // 1 hour expiration
    .sign(getEncodedSecret());
  
  if (!signedToken) {
    throw new Error('Failed to sign token');
  }
  
  return signedToken;
};

const decode = async (params: JWTDecodeParams): Promise<JWT | null> => {
  if (!params.token) {
    return null;
  }

  let token = params.token;

  if (token.startsWith('Bearer ')) {
    token = token.replace('Bearer ', '');
  }

  try {
    const decoded = await jose.jwtVerify(token, getEncodedSecret());

    if (!decoded.payload) {
      return null;
    }

    return decoded.payload as JWT;
  } catch (error) {
    
    return null;
  }
};

const jwtConfig = {
  encode,
  decode,
  getEncodedSecret,
};

export default jwtConfig;