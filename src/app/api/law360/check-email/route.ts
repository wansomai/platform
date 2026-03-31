import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createApiResponse, createBadRequestResponse } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return createBadRequestResponse('Email is required');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim() },
      select: { id: true, authProvider: true, emailVerified: true },
    });

    return createApiResponse({
      exists:        !!existingUser,
      authProvider:  existingUser?.authProvider ?? null,
      emailVerified: existingUser?.emailVerified ?? false,
    });
  } catch {
    return createApiResponse({ exists: false });
  }
}
