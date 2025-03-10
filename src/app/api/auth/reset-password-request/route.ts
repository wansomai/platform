// src/app/api/auth/reset-password-request/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Schema validation
const resetPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email address')
})

// POST handler for reset password request
export async function POST(request: NextRequest) {
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
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour
    
    // In a real app, you would store this token in the database
    // For this implementation, we'll simulate success
    
    // In a real app, you would send an email with the reset link:
    // const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`
    // await sendResetEmail(user.email, user.fullName, resetUrl)
    
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