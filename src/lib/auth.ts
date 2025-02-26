// src/lib/auth.ts
import jwt from 'jsonwebtoken'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'

const prisma = new PrismaClient()

// Environment variables (in a real app, these would be in .env file)
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN

// Verify and decode JWT token
export const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as jwt.Secret) as jwt.JwtPayload;
    if (!decoded.userId) throw new Error('Invalid token');
    return {
      userId: decoded.userId as string,
      iat: decoded.iat as number,
      exp: decoded.exp as number
    };
  } catch (error) {
    throw new Error('Invalid token')
  }
}

// Generate access token
export const generateAccessToken = (userId: string) => {
  return jwt.sign({ userId,expiresIn: JWT_EXPIRES_IN }, JWT_SECRET as jwt.Secret)
}

// Generate refresh token
export const generateRefreshToken = (userId: string) => {
    return jwt.sign({ userId,expiresIn: JWT_REFRESH_EXPIRES_IN  }, JWT_REFRESH_SECRET as jwt.Secret)
}

// Generate both tokens
export const generateTokens = (userId: string) => {
  return {
    access_token: generateAccessToken(userId),
    refresh_token: generateRefreshToken(userId)
  }
}

// NextAuth options
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            })
          })
          
          const data = await response.json()
          
          if (!response.ok) {
            return null
          }
          
          // Return the user and access token
          return {
            id: data.data.user.id,
            email: data.data.user.email,
            name: data.data.user.fullName,
            role: data.data.user.role,
            organization: data.data.user.organization,
            access_token: data.data.access_token,
            refresh_token: data.data.refresh_token
          }
        } catch (error) {
          console.error('Login error:', error)
          return null
        }
      }
    }),
    // Optionally enable OAuth providers
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
          })
        ]
      : [])
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        return {
          ...token,
          id: user.id,
          role: (user as any).role,
          organization: (user as any).organization,
          access_token: (user as any).access_token,
          refresh_token: (user as any).refresh_token
        }
      }
      
      // On subsequent calls, check if token needs refresh
      const tokenExpiry = token.exp as number
      const currentTime = Math.floor(Date.now() / 1000)
      const timeToExpiry = tokenExpiry - currentTime
      
      // If token is about to expire (less than 5 minutes), refresh it
      if (timeToExpiry < 300 && token.refresh_token) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              refresh_token: token.refresh_token
            })
          })
          
          const data = await response.json()
          
          if (!response.ok) {
            // If refresh fails, return original token for graceful logout
            return token
          }
          
          // Return updated token
          return {
            ...token,
            access_token: data.data.access_token,
            refresh_token: data.data.refresh_token,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour
          }
        } catch (error) {
          console.error('Token refresh error:', error)
          return token
        }
      }
      
      return token
    },
    
    async session({ session, token }) {
      if (token) {
        return {
          ...session,
          user: {
            ...session.user,
            id: token.id as string,
            role: token.role as string,
            organization: token.organization as {
              id: string
              name: string
            },
            access_token: token.access_token as string,
            refresh_token: token.refresh_token as string
          },
          expires: new Date(token.exp as number * 1000).toISOString()
        }
      }
      
      return session
    }
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/error',
    newUser: '/register'
  },
  secret: JWT_SECRET
}