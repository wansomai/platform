// src/app/api/auth/google-connection/connect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

/**
 * Initiate Google OAuth connection flow
 * Redirects user to Google consent screen
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get type parameter to determine which scopes to request
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'both';

    // Get the return URL from referer header
    const referer = request.headers.get('referer');
    let returnUrl = '/projects';
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        returnUrl = refererUrl.pathname;
      } catch (e) {
        // Use default
      }
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_AUTH_CLIENT_ID,
      process.env.GOOGLE_AUTH_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/google-connection/callback`
    );

    // Define required scopes based on type
    let scopes = [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    if (type === 'calendar' || type === 'both') {
      scopes.push('https://www.googleapis.com/auth/calendar');
    }

    if (type === 'gmail' || type === 'both') {
      scopes.push('https://www.googleapis.com/auth/gmail.readonly');
    }

    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent screen to get refresh token
      state: userId // Pass userId to retrieve in callback
    });

    // Redirect to Google consent screen and set a cookie with the return URL
    const response = NextResponse.redirect(authUrl);
    response.cookies.set('googleOAuthReturnUrl', returnUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    });

    return response;
  } catch (error) {
    console.error('Error initiating Google connection:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google connection' },
      { status: 500 }
    );
  }
}
