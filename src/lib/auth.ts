// src/lib/auth.ts
import jwt from 'jsonwebtoken'

// Define the JWT secret here directly to ensure it's consistent
// In production, this should be an environment variable
export const JWT_SECRET = "23cc5f842ca52345400e310985223cbd92444fba095df1bb9cf0f94a3fb6f9acc7b178a9aa8743db278c5d049946941e33099a15663cd45186c38028c87ed227"
export const JWT_EXPIRES_IN = '1h'
export const JWT_REFRESH_SECRET = "23cc5f842ca52345400e310985223cbd92444fba095df1bb9cf0f94a3fb6f9acc7b178a9aa8743db278c5d049946941e33099a15663cd45186c38028c87ed227"
export const JWT_REFRESH_EXPIRES_IN = '7d'

// Types
export interface TokenPayload {
  userId: string
  iat: number
  exp: number
}

// Verify and decode JWT token - With improved error handling
export const verifyToken = (token: string): TokenPayload => {
  try {
    // Use the hard-coded secret for verification
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    
    // Log success for debugging
    console.log(`Token verified successfully for user: ${decoded.userId}`)
    
    return decoded
  } catch (error) {
    // Enhanced error logging
    console.error('JWT verification error details:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('JWT verification failed:', error.message)
    } else if (error instanceof jwt.TokenExpiredError) {
      console.error('JWT token expired')
    } else {
      console.error('Unknown JWT error:', error)
    }
    
    throw new Error('Invalid token')
  }
}

// Verify refresh token
export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload
  } catch (error) {
    console.error('Refresh token verification failed:', error)
    throw new Error('Invalid refresh token')
  }
}

// Generate access token - Make sure we use the same secret for generation and verification
export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

// Generate refresh token
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN })
}

// Generate both tokens
export const generateTokens = (userId: string) => {
  return {
    access_token: generateAccessToken(userId),
    refresh_token: generateRefreshToken(userId)
  }
}

// Get token expiration in seconds
export const getTokenExpiration = (token: string): number => {
  try {
    const decoded = jwt.decode(token) as { exp: number }
    return decoded.exp
  } catch (error) {
    return 0
  }
}

// Check if token is about to expire (within 5 minutes)
export const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const exp = getTokenExpiration(token)
    const now = Math.floor(Date.now() / 1000)
    // Return true if token expires in less than 5 minutes
    return exp - now < 300
  } catch (error) {
    return true
  }
}

// Function to manually decode a token without verification (for debugging)
export const decodeToken = (token: string): any => {
  try {
    // Just decode without verification
    const decoded = jwt.decode(token)
    return decoded
  } catch (error) {
    console.error('Error decoding token:', error)
    return null
  }
}