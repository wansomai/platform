// src/app/api/law360/activate/route.ts
//
// Public (no auth required) subscription endpoint for Briefly by Wansom.
//
// Two paths:
//   1. Email exists → subscribe immediately (email verification handled on Wansom AI side)
//   2. Email not found → create Wansom account, subscribe, send welcome + credentials email

import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { createApiResponse, createErrorResponse, createBadRequestResponse } from '@/lib/api/response';
import { AppError } from '@/types/error';
import { sendDigestSubscriptionEmail, sendLaw360WelcomeEmail } from '@/lib/email-service';
import { PRACTICE_AREA_LABELS } from '@/types/associates';
import { JURISDICTIONS } from '@/services/legalDigestService';

const activateSchema = z.object({
  email:         z.string().email('A valid email address is required'),
  frequency:     z.enum(['daily', 'weekly']),
  topics:        z.array(z.string()).min(1, 'Select at least one topic'),
  jurisdictions: z.array(z.string()).min(1, 'Select at least one jurisdiction'),
});

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  return pwd;
}

function getNameFromEmail(email: string): string {
  return email.split('@')[0]
    .split(/[._-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return createBadRequestResponse('Invalid request body'); }

  const parsed = activateSchema.safeParse(body);
  if (!parsed.success) {
    return createBadRequestResponse(parsed.error.errors[0].message);
  }

  const { email, frequency, topics, jurisdictions } = parsed.data;

  const jurisdictionNames = jurisdictions.map(
    (code) => JURISDICTIONS[code]?.name || code
  );
  const topicLabels = topics.map(
    (t) => PRACTICE_AREA_LABELS[t as keyof typeof PRACTICE_AREA_LABELS] || t
  );

  const existingUser = await prisma.user.findUnique({
    where:   { email: email.trim().toLowerCase() },
    include: { organization: true },
  });

  // ── Path 1: existing Wansom user (verified or not) ───────────────────────
  if (existingUser) {
    const organizationId = existingUser.organizationId;

    const isNew = !(await prisma.digestSubscription.findUnique({
      where: { userId_organizationId: { userId: existingUser.id, organizationId } },
    }));

    await prisma.digestSubscription.upsert({
      where:  { userId_organizationId: { userId: existingUser.id, organizationId } },
      update: { frequency, topics, jurisdictions, isActive: true },
      create: { userId: existingUser.id, organizationId, frequency, topics, jurisdictions, isActive: true },
    });

    if (isNew) {
      sendDigestSubscriptionEmail({
        email:         existingUser.email,
        fullName:      existingUser.fullName || getNameFromEmail(existingUser.email),
        frequency,
        jurisdictions: jurisdictionNames,
        topics:        topicLabels,
      }).catch((err) =>
        console.error(
          '[activate] confirmation email failed',
          {
            source: 'POST /api/law360/activate',
            path: 'existing-user-subscription',
            userId: existingUser.id,
            organizationId,
            email: existingUser.email,
            frequency,
            jurisdictions,
            topics,
            error: err instanceof Error
              ? { name: err.name, message: err.message, stack: err.stack }
              : err,
          }
        )
      );
    }

    return createApiResponse(
      { isNewUser: false, userEmail: existingUser.email },
      'You\'re subscribed to Briefly by Wansom!'
    );
  }

  // ── Path 3: new user — create account, subscribe, send welcome email ────────
  const tempPassword  = generateTempPassword();
  const fullName      = getNameFromEmail(email);
  const magicToken    = crypto.randomBytes(32).toString('hex');
  const magicExpiry   = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const { OrganizationRole, AccountType } = await import('@/lib/constants/roles');

  const newUser = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name:        `${fullName}'s Organization`,
        accountType: AccountType.PERSONAL,
      },
    });

    const user = await tx.user.create({
      data: {
        email:            email.trim().toLowerCase(),
        password:         await bcrypt.hash(tempPassword, 10),
        fullName,
        organizationId:   org.id,
        emailVerified:    true,
        authProvider:     'email',
        resetToken:       magicToken,
        resetTokenExpiry: magicExpiry,
      },
    });

    await tx.userOrganization.create({
      data: {
        userId:         user.id,
        organizationId: org.id,
        role:           OrganizationRole.OWNER,
      },
    });

    await tx.digestSubscription.create({
      data: {
        userId:         user.id,
        organizationId: org.id,
        frequency,
        topics,
        jurisdictions,
        isActive: true,
      },
    });

    return user;
  });

  sendLaw360WelcomeEmail({
    email:         newUser.email,
    fullName:      newUser.fullName || fullName,
    password:      tempPassword,
    frequency,
    jurisdictions: jurisdictionNames,
    topics:        topicLabels,
  }).catch((err) =>
    console.error(
      '[activate] welcome email failed',
      {
        source: 'POST /api/law360/activate',
        path: 'new-user-welcome',
        userId: newUser.id,
        organizationId: newUser.organizationId,
        email: newUser.email,
        frequency,
        jurisdictions,
        topics,
        error: err instanceof Error
          ? { name: err.name, message: err.message, stack: err.stack }
          : err,
      }
    )
  );

  return createApiResponse(
    { isNewUser: true, tempPassword, userEmail: newUser.email, magicToken },
    'Your Wansom account and Briefly subscription have been created!'
  );
}
