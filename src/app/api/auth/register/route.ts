// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { generateTokens } from '@/lib/auth/token-service';
import { prepareUserForToken, prepareUserResponse, generateAuthCookieHeader } from '@/lib/auth/auth-utils';
import { sendWelcomeEmail, sendVerificationEmail } from '@/lib/email-service';
import { OrganizationRole, AccountType } from '@/lib/constants/roles';

// Schema validation for normal registration
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
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

    // If there's an invitation token, verify it first before checking existing user
    let invitationOrganizationId: string | null = null;
    let invitationRole: string | null = null;
    if (invitationToken) {
      const invitation = await prisma.invitation.findUnique({
        where: { token: invitationToken },
        select: {
          organizationId: true,
          email: true,
          expiresAt: true,
          role: true
        }
      });

      if (!invitation) {
        return NextResponse.json(
          { status: 400, message: 'Invalid invitation token' },
          { status: 400 }
        );
      }

      if (new Date() > invitation.expiresAt) {
        return NextResponse.json(
          { status: 400, message: 'This invitation has expired' },
          { status: 400 }
        );
      }

      if (invitation.email !== email) {
        return NextResponse.json(
          { status: 400, message: 'Email does not match the invitation' },
          { status: 400 }
        );
      }

      invitationOrganizationId = invitation.organizationId;
      invitationRole = invitation.role || OrganizationRole.MEMBER;

      // If the user already has an account, accept the invitation for them and
      // redirect them to login — no need to create a new account.
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        // Add to the invited org if not already a member
        await prisma.userOrganization.upsert({
          where: {
            userId_organizationId: {
              userId: existingUser.id,
              organizationId: invitationOrganizationId
            }
          },
          create: {
            userId: existingUser.id,
            organizationId: invitationOrganizationId,
            role: invitation.role || OrganizationRole.MEMBER
          },
          update: {}
        });

        // Set the invited org as active
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { activeOrganizationId: invitationOrganizationId }
        });

        // Mark the invitation as accepted
        await prisma.invitation.update({
          where: { token: invitationToken },
          data: { status: 'accepted' }
        });

        return NextResponse.json({
          status: 200,
          message: 'Invitation accepted. Please sign in to continue.',
          data: { existingUser: true }
        });
      }
    }

    // Check if user already exists (no invitation token path)
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { status: 400, message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ALWAYS create a personal organization for the user
    const personalOrgName = organizationName || `${fullName}'s Organization`;

    // Create user and personal organization in a transaction
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: fullName || '',
        role: 'admin', // Keep for backwards compatibility
        organization: {
          create: {
            name: personalOrgName,
            accountType: AccountType.PERSONAL, // Personal account by default
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

    // Set the user as the owner of their personal organization
    await prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        ownerId: user.id
      }
    });

    // Create UserOrganization with OWNER role for the personal organization
    await prisma.userOrganization.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        role: OrganizationRole.OWNER // Owner of their personal organization
      }
    });

    // If there's an invitation, also add them to that organization
    if (invitationToken && invitationOrganizationId) {
      // Create UserOrganization for the invited organization with the specified role
      await prisma.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: invitationOrganizationId,
          role: invitationRole || OrganizationRole.MEMBER
        }
      });

      // Set the invited organization as the active one
      await prisma.user.update({
        where: { id: user.id },
        data: {
          activeOrganizationId: invitationOrganizationId
        }
      });

      // Mark the invitation as accepted
      await prisma.invitation.update({
        where: { token: invitationToken },
        data: {
          status: 'accepted'
        }
      });
    }
    
    // Send welcome email + verification email
    try {
      await sendWelcomeEmail({ email: user.email, fullName: user.fullName || 'User' });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
    }

    try {
      const crypto = await import('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerificationToken: token, emailVerificationExpires: expires },
      });
      const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;
      await sendVerificationEmail({ email: user.email, fullName: user.fullName }, verificationUrl);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
    }
    
    // Prepare user data using shared utilities
    const userForToken = prepareUserForToken(user);
    const { access_token, refresh_token } = generateTokens(userForToken);
    const userData = prepareUserResponse(user);

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
        'Set-Cookie': generateAuthCookieHeader(access_token, refresh_token)
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