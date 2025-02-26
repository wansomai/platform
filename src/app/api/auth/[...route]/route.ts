// src/app/api/auth/[...route]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { hash, compare } from 'bcrypt'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Environment variables (in a real app, these would be in .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

// Schema validation
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters')
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required')
})

const resetPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email address')
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

// Helper functions
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({id: userId,expiresIn: JWT_EXPIRES_IN }, JWT_SECRET)
  const refreshToken = jwt.sign({ userId, expiresIn: JWT_REFRESH_EXPIRES_IN }, JWT_REFRESH_SECRET as jwt.Secret)
  
  return { access_token: accessToken, refresh_token: refreshToken }
}

// Route handler
export async function POST(
  request: NextRequest,
  { params }: { params: { route: string[] } }
) {
  const route = params.route[0]
  
  // Register route
  if (route === 'register') {
    try {
      const body = await request.json()
      const { email, password, fullName, organizationName } = registerSchema.parse(body)
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })
      
      if (existingUser) {
        return NextResponse.json(
          { 
            status: 400,
            message: 'User with this email already exists' 
          },
          { status: 400 }
        )
      }
      
      // Hash password
      const hashedPassword = await hash(password, 10)
      
      // Create organization first
      const organization = await prisma.organization.create({
        data: {
          name: organizationName
        }
      })
      
      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          role: 'admin', // First user is admin
          organizationId: organization.id
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
      
      // Generate tokens
      const tokens = generateTokens(user.id)
      
      return NextResponse.json({
        status: 201,
        message: 'User registered successfully',
        data: {
          user,
          ...tokens
        }
      }, { status: 201 })
    } catch (error) {
      console.error('Registration error:', error)
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            status: 400,
            message: 'Validation failed', 
            errors: error.errors 
          },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { 
          status: 500,
          message: 'Internal server error' 
        },
        { status: 500 }
      )
    }
  }
  
  // Login route
  if (route === 'login') {
    try {
      const body = await request.json()
      const { email, password } = loginSchema.parse(body)
      
      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          fullName: true,
          role: true,
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
      
      if (!user) {
        return NextResponse.json(
          { 
            status: 401,
            message: 'Invalid credentials' 
          },
          { status: 401 }
        )
      }
      
      // Compare password
      const passwordMatch = await compare(password, user.password)
      
      if (!passwordMatch) {
        return NextResponse.json(
          { 
            status: 401,
            message: 'Invalid credentials' 
          },
          { status: 401 }
        )
      }
      
      // Generate tokens
      const tokens = generateTokens(user.id)
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user
      
      return NextResponse.json({
        status: 200,
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
          ...tokens
        }
      })
    } catch (error) {
      console.error('Login error:', error)
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            status: 400,
            message: 'Validation failed', 
            errors: error.errors 
          },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { 
          status: 500,
          message: 'Internal server error' 
        },
        { status: 500 }
      )
    }
  }
  
  // Refresh token route
  if (route === 'refresh-token') {
    try {
      const body = await request.json()
      const { refresh_token } = refreshTokenSchema.parse(body)
      
      // Verify refresh token
      const decoded = jwt.verify(refresh_token, JWT_REFRESH_SECRET) as { userId: string }
      const userId = decoded.userId
      
      // Find user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
      
      if (!user) {
        return NextResponse.json(
          { 
            status: 401,
            message: 'Invalid refresh token' 
          },
          { status: 401 }
        )
      }
      
      // Generate new tokens
      const tokens = generateTokens(user.id)
      
      return NextResponse.json({
        status: 200,
        message: 'Token refreshed successfully',
        data: {
          user,
          ...tokens
        }
      })
    } catch (error) {
      console.error('Token refresh error:', error)
      
      return NextResponse.json(
        { 
          status: 401,
          message: 'Invalid refresh token' 
        },
        { status: 401 }
      )
    }
  }
  
  // Reset password request route
  if (route === 'reset-password-request') {
    try {
      const body = await request.json()
      const { email } = resetPasswordRequestSchema.parse(body)
      
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { email }
      })
      
      if (!user) {
        // To prevent email enumeration, always return success
        return NextResponse.json({
          status: 200,
          message: 'If your email is registered, you will receive a password reset link'
        })
      }
      
      // In a real app, you would generate a token and send an email
      // For demo purposes, just return success
      
      return NextResponse.json({
        status: 200,
        message: 'If your email is registered, you will receive a password reset link'
      })
    } catch (error) {
      console.error('Reset password request error:', error)
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            status: 400,
            message: 'Validation failed', 
            errors: error.errors 
          },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { 
          status: 500,
          message: 'Internal server error' 
        },
        { status: 500 }
      )
    }
  }
  
  // Reset password route
  if (route === 'reset-password') {
    try {
      const body = await request.json()
      const { token, password } = resetPasswordSchema.parse(body)
      
      // In a real app, you would verify the token and update the password
      // For demo purposes, just return success
      
      return NextResponse.json({
        status: 200,
        message: 'Password reset successfully'
      })
    } catch (error) {
      console.error('Reset password error:', error)
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            status: 400,
            message: 'Validation failed', 
            errors: error.errors 
          },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { 
          status: 500,
          message: 'Internal server error' 
        },
        { status: 500 }
      )
    }
  }
  
  // Logout route
  if (route === 'logout') {
    // In a stateless JWT auth system, client-side logout is typically sufficient
    // However, you could implement token blacklisting for added security
    return NextResponse.json({
      status: 200,
      message: 'Logged out successfully'
    })
  }
  
  // Route not found
  return NextResponse.json(
    { 
      status: 404,
      message: 'Route not found' 
    },
    { status: 404 }
  )
}