// src/app/api/auth/google-connection/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import { withErrorHandler } from '@/lib/api/middleware';

const prisma = new PrismaClient();

/**
 * Handle Google OAuth callback
 * Exchanges authorization code for tokens and saves to database
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // userId
    const error = searchParams.get('error');

    // Handle user cancellation
    if (error === 'access_denied') {
      return NextResponse.redirect(
        new URL('/projects?connection=cancelled', process.env.NEXTAUTH_URL!)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/projects?connection=error&message=missing_parameters', process.env.NEXTAUTH_URL!)
      );
    }

    const userId = state;

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_AUTH_CLIENT_ID,
      process.env.GOOGLE_AUTH_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/google-connection/callback`
    );

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      return NextResponse.redirect(
        new URL('/projects?connection=error&message=no_access_token', process.env.NEXTAUTH_URL!)
      );
    }

    // Get user's Google account info
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Save or update account in database
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: userInfo.id!
        }
      },
      create: {
        userId: userId,
        type: 'oauth',
        provider: 'google',
        providerAccountId: userInfo.id!,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
        token_type: tokens.token_type,
        scope: tokens.scope,
        id_token: tokens.id_token
      },
      update: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || undefined,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
        token_type: tokens.token_type,
        scope: tokens.scope,
        id_token: tokens.id_token
      }
    });

    console.log('✅ Google account connected successfully for user:', userId);

    // Redirect back to app with success message
    // Use stored return URL or default to projects page
    const returnPath = request.cookies.get('googleOAuthReturnUrl')?.value || '/projects';
    const redirectUrl = new URL(returnPath, process.env.NEXTAUTH_URL!);
    redirectUrl.searchParams.set('connection', 'success');

    // Clear the cookie
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete('googleOAuthReturnUrl');

    return response;
  } catch (error) {
    console.error('Error handling Google OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/projects?connection=error&message=callback_failed', process.env.NEXTAUTH_URL!)
    );
  }
});
