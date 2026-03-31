import { NextRequest } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { createApiResponse, createErrorResponse, createBadRequestResponse } from '@/lib/api/response';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import { sendVerificationEmail } from '@/lib/email-service';
import { AppError } from '@/types/error';

const RESEND_COOLDOWN_MINUTES = 2;

export const POST = withErrorHandler(
  withAuth(async (_req: NextRequest, userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        emailVerified: true,
        authProvider: true,
        emailVerificationExpires: true,
      },
    });

    if (!user) {
      return createErrorResponse(new AppError('User not found', 'USER_NOT_FOUND', 404));
    }

    if (user.emailVerified) {
      // Already verified — treat as success so the client just refreshes
      return createApiResponse(null, 'Email is already verified');
    }

    // Google users are always verified
    if (user.authProvider === 'google') {
      return createApiResponse(null, 'Email is already verified');
    }

    // Enforce resend cooldown
    if (user.emailVerificationExpires) {
      const cooldownUntil = new Date(user.emailVerificationExpires.getTime() - 24 * 60 * 60 * 1000 + RESEND_COOLDOWN_MINUTES * 60 * 1000);
      if (new Date() < cooldownUntil) {
        const secsLeft = Math.ceil((cooldownUntil.getTime() - Date.now()) / 1000);
        return createErrorResponse(
          new AppError(`Please wait ${secsLeft}s before requesting another email`, 'RESEND_TOO_SOON', 429)
        );
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerificationToken: token, emailVerificationExpires: expires },
    });

    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;

    try {
      await sendVerificationEmail({ email: user.email, fullName: user.fullName }, verificationUrl);
    } catch {
      return createErrorResponse(new AppError('Failed to send verification email', 'EMAIL_SEND_FAILED', 500));
    }

    return createApiResponse(null, 'Verification email sent');
  })
);
