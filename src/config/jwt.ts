// src/config/jwt.ts
import { JWT, JWTDecodeParams, JWTEncodeParams } from 'next-auth/jwt';
import * as jose from 'jose';

// We'll use a consistent secret
const NEXTAUTH_SECRET = "23cc5f842ca52345400e310985223cbd92444fba095df1bb9cf0f94a3fb6f9acc7b178a9aa8743db278c5d049946941e33099a15663cd45186c38028c87ed227";
const encodedSecret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || NEXTAUTH_SECRET);

const encode = async (params: JWTEncodeParams): Promise<string> => {
  const signedToken = await new jose.SignJWT(params.token as Record<string, any>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h') // 1 hour expiration
    .sign(encodedSecret);
  
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
    const decoded = await jose.jwtVerify(token, encodedSecret);

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
  encodedSecret,
};

export default jwtConfig;