// src/app/api/auth/google-connection/disconnect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/prisma/client';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';

const prisma = new PrismaClient();

/**
 * Disconnect Google account
 * Removes Google OAuth tokens from database
 */
export const POST = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string
) => {
  try {
    // Delete user's Google account
    const deleted = await prisma.account.deleteMany({
      where: {
        userId: userId,
        provider: 'google'
      }
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'No Google account found to disconnect' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Google account disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting Google account:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Google account' },
      { status: 500 }
    );
  }
}));
