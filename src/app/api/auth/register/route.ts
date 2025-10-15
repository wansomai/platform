// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { generateTokens } from '@/lib/auth/token-service';
import { sendWelcomeEmail } from '@/lib/email-service';

const prisma = new PrismaClient();

// Schema validation for normal registration
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').nonempty('Full name is required'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters').optional(),
  invitationToken: z.string().optional()
});

const parseRequestBody = async (request: NextRequest) => {
  const body = await request.json();
  return registerSchema.parse(body);
};

// POST handler for registration
export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, organizationName, invitationToken } = await parseRequestBody(request);

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

    // If there's an invitation token, verify it and get the organization
    let invitationOrganizationId: string | null = null;
    if (invitationToken) {
      const invitation = await prisma.invitation.findUnique({
        where: { token: invitationToken },
        select: {
          organizationId: true,
          email: true,
          expiresAt: true
        }
      });

      if (!invitation) {
        return NextResponse.json(
          {
            status: 400,
            message: 'Invalid invitation token'
          },
          { status: 400 }
        );
      }

      if (new Date() > invitation.expiresAt) {
        return NextResponse.json(
          {
            status: 400,
            message: 'This invitation has expired'
          },
          { status: 400 }
        );
      }

      if (invitation.email !== email) {
        return NextResponse.json(
          {
            status: 400,
            message: 'Email does not match the invitation'
          },
          { status: 400 }
        );
      }

      invitationOrganizationId = invitation.organizationId;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ALWAYS create a personal organization for the user
    const personalOrgName = organizationName || `${fullName}'s Organization`;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: fullName || '',
        role: 'admin', // Admin of their personal organization
        organization: {
          create: {
            name: personalOrgName,
            contactEmail: "",
            contactPhone: "",
            currentWebsite: "",
            firmSize: "",
            firmStory: "",
            linkedinUrl: "",
            onboardingCompleted: false,
            practiceAreas: [],
            profileStatus: "pending",
            serviceAreas: [],
            yearsInPractice: 0
          }
        }
      },
      include: {
        organization: true
      }
    });

    // Create UserOrganization for the personal organization
    await prisma.userOrganization.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        role: 'admin'
      }
    });

    // If there's an invitation, also add them to that organization
    if (invitationToken && invitationOrganizationId) {
      // Create UserOrganization for the invited organization
      await prisma.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: invitationOrganizationId,
          role: 'member'
        }
      });

      // Set the invited organization as the active one
      await prisma.user.update({
        where: { id: user.id },
        data: {
          activeOrganizationId: invitationOrganizationId
        }
      });
    }
    
    // Send welcome email
    try {
      await sendWelcomeEmail({
        email: user.email,
        fullName: user.fullName || 'User'
      });
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