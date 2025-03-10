import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcrypt'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Environment variables
const JWT_SECRET = "23cc5f842ca52345400e310985223cbd92444fba095df1bb9cf0f94a3fb6f9acc7b178a9aa8743db278c5d049946941e33099a15663cd45186c38028c87ed227"
const JWT_EXPIRES_IN = '1h'
const JWT_REFRESH_SECRET = "23cc5f842ca52345400e310985223cbd92444fba095df1bb9cf0f94a3fb6f9acc7b178a9aa8743db278c5d049946941e33099a15663cd45186c38028c87ed227"
const JWT_REFRESH_EXPIRES_IN = '7d'

// Schema validation
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters')
})

// Helper functions
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET as jwt.Secret, { expiresIn: JWT_EXPIRES_IN })
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET as jwt.Secret, { expiresIn: JWT_REFRESH_EXPIRES_IN })
  
  return { access_token: accessToken, refresh_token: refreshToken }
}

// POST handler for registration
export async function POST(request: NextRequest) {
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