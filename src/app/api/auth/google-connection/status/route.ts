// src/app/api/auth/google-connection/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';

const prisma = new PrismaClient();

// Required scopes for Calendar and Gmail
const REQUIRED_SCOPES = {
  calendar: 'https://www.googleapis.com/auth/calendar',
  gmail: 'https://www.googleapis.com/auth/gmail.readonly',
  gmailCompose: 'https://www.googleapis.com/auth/gmail.compose'
};

/**
 * Check if user has connected their Google account with proper scopes
 */
export const GET = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string
) => {
  try {
    // Find user's Google account
    const account = await prisma.account.findFirst({
      where: {
        userId: userId,
        provider: 'google'
      },
      select: {
        access_token: true,
        refresh_token: true,
        expires_at: true,
        scope: true,
        providerAccountId: true
      }
    });

    if (!account || !account.access_token) {
      return NextResponse.json({
        connected: false,
        email: null,
        hasCalendarAccess: false,
        hasGmailAccess: false,
        message: 'No Google account connected'
      });
    }

    // Check scopes
    const scopes = account.scope?.split(' ') || [];
    const hasCalendarAccess = scopes.includes(REQUIRED_SCOPES.calendar);
    const hasGmailAccess = scopes.includes(REQUIRED_SCOPES.gmail) ||
                          scopes.includes(REQUIRED_SCOPES.gmailCompose);

    // Get user email from Google account
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    return NextResponse.json({
    status: 200,
    message: 'Folders retrieved successfully',
    data: {
      connected: true,
      email: user?.email || null,
      hasCalendarAccess,
      hasGmailAccess,
      grantedScopes: scopes,
      tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000).toISOString() : null
    }});
  } catch (error) {
    console.error('Error checking Google connection status:', error);
    return NextResponse.json(
      { error: 'Failed to check Google connection status' },
      { status: 500 }
    );
  }
}));
