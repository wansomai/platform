import { verifyRefreshToken, generateTokens } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextRequest,NextResponse } from "next/server"


const prisma = new PrismaClient();
// src/app/api/auth/refresh-token/route.ts
export async function POST(request: NextRequest) {
    try {
      // Get the refresh token from cookies first, then from request body
      const refreshToken = request.cookies.get('refresh-token')?.value
      const token = refreshToken 
      
      if (!token) {
        return NextResponse.json(
          { 
            status: 400,
            code: 'VALIDATION_ERROR',
            message: 'Refresh token is required',
            data: null 
          },
          { status: 400 }
        )
      }
      
      try {
        // Verify the refresh token
        const decoded = verifyRefreshToken(token) 
        
        // Generate new tokens
        const { access_token, refresh_token } = generateTokens(decoded.userId)
        // Find the user (in a real app, this would query your database)
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            organization: true
          }
        })
        if (!user) {
          return NextResponse.json(
            { 
              status: 404,
              code: 'NOT_FOUND',
              message: 'User not found',
              data: null 
            },
            { status: 404 }
          )
        }
        
        // User data to return (excluding password)
        const userData = {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          organization: user.organization
        }
        
        // Set the refresh token in a HTTP-only cookie
        const response = NextResponse.json(
          {
            status: 200,
            code: 'SUCCESS',
            message: 'Token refreshed successfully',
            data: {
              access_token,
              refresh_token,
              user: userData
            }
          },
          { status: 200 }
        )
        
        // Set the refresh token in a cookie
        response.cookies.set({
          name: 'refresh_token',
          value: refresh_token,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/'
        })
        
        return response
      } catch (error) {
        return NextResponse.json(
          { 
            status: 401,
            code: 'UNAUTHORIZED',
            message: 'Invalid refresh token',
            data: null 
          },
          { status: 401 }
        )
      }
    } catch (error) {
      console.error('Refresh token error:', error)
      
      return NextResponse.json(
        { 
          status: 500,
          code: 'SERVER_ERROR',
          message: 'Server error',
          data: null 
        },
        { status: 500 }
      )
    }
  }