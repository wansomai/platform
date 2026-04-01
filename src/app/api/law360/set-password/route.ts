// src/app/api/law360/set-password/route.ts
//
// Public endpoint — lets a newly created Briefly user change their temp password
// before their first login. Validates the current password to confirm identity.

import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { createApiResponse, createErrorResponse, createBadRequestResponse } from '@/lib/api/response';
import { AppError } from '@/types/error';

const schema = z.object({
  email:           z.string().email(),
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return createBadRequestResponse('Invalid request body'); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return createBadRequestResponse(parsed.error.errors[0].message);
  }

  const { email, currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    return createErrorResponse(new AppError('Invalid credentials', 'INVALID_CREDENTIALS', 401));
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return createErrorResponse(new AppError('Invalid credentials', 'INVALID_CREDENTIALS', 401));
  }

  await prisma.user.update({
    where: { id: user.id },
    data:  { password: await bcrypt.hash(newPassword, 10) },
  });

  return createApiResponse(null, 'Password updated successfully');
}
