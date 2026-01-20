// src/app/api/events/law-school-launch/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';
import { sendEventRegistrationEmail } from '@/lib/event-email-templates';

// Validation schema
const registrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  institution: z.string().min(2, 'Institution name is required'),
  email: z.string().email('Invalid email address'),
  registrationType: z.string().min(1, 'Registration type is required'),
  competitions: z.array(z.string()).default([]),
});

/**
 * Generate a secure opt-in token
 */
function generateOptInToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * POST handler for event registration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registrationSchema.parse(body);

    const { name, institution, email, registrationType, competitions } = validatedData;

    // Check if email is already registered for this event
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: { email },
    });

    if (existingRegistration) {
      return NextResponse.json(
        {
          status: 400,
          message: 'This email is already registered for the event.',
        },
        { status: 400 }
      );
    }

    // Generate unique opt-in token
    const optInToken = generateOptInToken();

    // Create event registration
    const registration = await prisma.eventRegistration.create({
      data: {
        name,
        institution,
        email,
        registrationType,
        competitions,
        optInToken,
        hasOptedIn: false,
        accountCreated: false,
      },
    });

    // Send confirmation email with opt-in link
    try {
      await sendEventRegistrationEmail({
        name,
        email,
        institution,
        optInToken,
      });
    } catch (emailError) {
      // Log error but don't fail registration
      console.error('Error sending registration email:', emailError);
      // Note: In production, you might want to queue this for retry
    }

    return NextResponse.json(
      {
        status: 201,
        message: 'Registration successful! Check your email for next steps.',
        data: {
          id: registration.id,
          name: registration.name,
          email: registration.email,
          institution: registration.institution,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Event registration error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          status: 400,
          message: 'Validation failed',
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        status: 500,
        message: 'Internal server error. Please try again later.',
      },
      { status: 500 }
    );
  }
}
