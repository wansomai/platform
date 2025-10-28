// src/app/api/events/opt-in/activate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateTokens } from '@/lib/auth/token-service';
import { sendWansomProCredentialsEmail } from '@/lib/event-email-templates';

const prisma = new PrismaClient();

/**
 * Generate a secure random password
 */
function generateSecurePassword(length = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  const allChars = lowercase + uppercase + numbers + symbols;

  let password = '';

  // Ensure at least one of each type
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += symbols[crypto.randomInt(symbols.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
}

/**
 * GET handler for account activation
 * This creates the account and returns auth tokens
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        {
          status: 400,
          message: 'Invalid activation token.',
        },
        { status: 400 }
      );
    }

    // Find the event registration by token
    const registration = await prisma.eventRegistration.findUnique({
      where: { optInToken: token },
    });

    if (!registration) {
      return NextResponse.json(
        {
          status: 404,
          message: 'Invalid activation link. Please check your email and try again.',
        },
        { status: 404 }
      );
    }

    // Check if already opted in
    if (registration.hasOptedIn && registration.accountCreated) {
      return NextResponse.json(
        {
          status: 400,
          message: 'This account has already been activated. Please log in.',
        },
        { status: 400 }
      );
    }

    // Check if user already exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: registration.email },
    });

    if (existingUser) {
      // Update registration status
      await prisma.eventRegistration.update({
        where: { id: registration.id },
        data: {
          hasOptedIn: true,
          accountCreated: true,
          userId: existingUser.id,
        },
      });

      return NextResponse.json(
        {
          status: 400,
          message: 'An account with this email already exists. Please log in.',
        },
        { status: 400 }
      );
    }

    // Generate secure password
    const generatedPassword = generateSecurePassword(12);
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Create user and organization in a transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create user with organization
      const newUser = await tx.user.create({
        data: {
          email: registration.email,
          password: hashedPassword,
          fullName: registration.name,
          role: 'admin',
          organization: {
            create: {
              name: registration.institution,
              contactEmail: registration.email,
              contactPhone: '',
              currentWebsite: '',
              firmSize: 'student',
              firmStory: `Student from ${registration.institution}`,
              linkedinUrl: '',
              onboardingCompleted: false,
              practiceAreas: [],
              profileStatus: 'pending',
              serviceAreas: [],
              yearsInPractice: 0,
            },
          },
        },
        include: {
          organization: true,
        },
      });

      // Update event registration
      await tx.eventRegistration.update({
        where: { id: registration.id },
        data: {
          hasOptedIn: true,
          accountCreated: true,
          userId: newUser.id,
        },
      });

      return newUser;
    });

    // Send credentials email
    try {
      await sendWansomProCredentialsEmail({
        name: registration.name,
        email: registration.email,
        password: generatedPassword,
      });
    } catch (emailError) {
      console.error('Error sending credentials email:', emailError);
      // Don't fail the process if email fails
    }

    // Generate auth tokens
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
      },
    };

    const { access_token, refresh_token } = generateTokens(userForToken);

    // Set auth cookies and return success
    const response = NextResponse.json(
      {
        status: 200,
        message: 'Account activated successfully!',
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            organizationName: user.organization.name,
          },
        },
      },
      { status: 200 }
    );

    // Set auth cookies
    const isProduction = process.env.NODE_ENV === 'production';

    response.cookies.set('auth-token', access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
      path: '/',
    });

    response.cookies.set('refresh-token', refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 604800, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Account activation error:', error);

    return NextResponse.json(
      {
        status: 500,
        message: 'Something went wrong. Please try again or contact support at law@wansom.ai',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
