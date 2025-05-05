// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { generateTokens } from '@/lib/auth/token-service';
import { sendWelcomeEmail } from '@/lib/mail';

const prisma = new PrismaClient();

// Schema validation
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').nonempty('Full name is required'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters')
});

const parseRequestBody = async (request: NextRequest) => {
  const body = await request.json();
  return registerSchema.parse(body);
};

// POST handler for registration
export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, organizationName } = await parseRequestBody(request);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { 
          status: 400,
          message: 'User with this email already exists' 
        },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: fullName || '',
        role: 'admin',
        organization: {
          create: {
            name: organizationName
          }
        }
      },
      include: {
        organization: true
      }
    });
    
    // Send welcome email
    try {
      await sendWelcomeEmail({
        email: user.email,
        fullName: user.fullName || 'User'
      });
      console.log(`Welcome email sent to ${user.email}`);
    } catch (emailError) {
      // Log the error but don't fail the registration process
      console.error('Error sending welcome email:', emailError);
    }
    
    // Prepare the user object for token generation
    const userForToken = {
      id: user.id,
      email: user.email,
      fullName: String(user.fullName || ''),
      name: String(user.fullName || ''),
      role: user.role,
      organizationId: user.organizationId,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
      }
    };
    
    // Generate tokens using our centralized service
    const { access_token, refresh_token } = generateTokens(userForToken);
    
    // Prepare user data for response (without sensitive data)
    const userData = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
      }
    };
    
    return NextResponse.json({
      status: 201,
      message: 'User registered successfully',
      data: {
        user: userData,
        access_token,
        refresh_token
      }
    }, { 
      status: 201,
      headers: {
        'Set-Cookie': `auth-token=${access_token}; Path=/; HttpOnly; Max-Age=3600; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}, refresh-token=${refresh_token}; Path=/; HttpOnly; Max-Age=604800; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          status: 400,
          message: 'Validation failed', 
          errors: error.errors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}