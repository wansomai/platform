// src/lib/googleOAuth.ts
import { google } from 'googleapis';
import prisma from '@/lib/prisma';

/**
 * Get Google OAuth2 client for a user
 * @param userId - The user's ID
 * @returns Authenticated OAuth2 client or null if no account found
 */
export async function getGoogleOAuthClient(userId: string) {
  try {
    // Fetch the user's Google account from the database
    const account = await prisma.account.findFirst({
      where: {
        userId: userId,
        provider: 'google',
      },
    });

    if (!account || !account.access_token) {
      console.error('No Google account found for user:', userId);
      return null;
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_AUTH_CLIENT_ID,
      process.env.GOOGLE_AUTH_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + '/api/auth/callback/google'
    );

    // Set credentials
    oauth2Client.setCredentials({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      expiry_date: account.expires_at ? account.expires_at * 1000 : undefined, // Convert to milliseconds
      token_type: account.token_type || 'Bearer',
      scope: account.scope || '',
    });

    // Set up automatic token refresh
    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.refresh_token) {
        // Update the database with new tokens
        await prisma.account.updateMany({
          where: {
            userId: userId,
            provider: 'google',
          },
          data: {
            access_token: tokens.access_token,
            expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
            refresh_token: tokens.refresh_token,
          },
        });
      } else if (tokens.access_token) {
        // Only update access token
        await prisma.account.updateMany({
          where: {
            userId: userId,
            provider: 'google',
          },
          data: {
            access_token: tokens.access_token,
            expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
          },
        });
      }
    });

    return oauth2Client;
  } catch (error) {
    console.error('Error getting Google OAuth client:', error);
    return null;
  }
}

/**
 * Check if user has connected their Google account
 * @param userId - The user's ID
 * @returns Boolean indicating if Google account is connected
 */
export async function hasGoogleAccount(userId: string): Promise<boolean> {
  try {
    const account = await prisma.account.findFirst({
      where: {
        userId: userId,
        provider: 'google',
      },
    });

    return !!account && !!account.access_token;
  } catch (error) {
    console.error('Error checking Google account:', error);
    return false;
  }
}

/**
 * Get Google account scopes for a user
 * @param userId - The user's ID
 * @returns Array of granted scopes or null
 */
export async function getGoogleAccountScopes(userId: string): Promise<string[] | null> {
  try {
    const account = await prisma.account.findFirst({
      where: {
        userId: userId,
        provider: 'google',
      },
      select: {
        scope: true,
      },
    });

    if (!account || !account.scope) {
      return null;
    }

    return account.scope.split(' ');
  } catch (error) {
    console.error('Error getting Google account scopes:', error);
    return null;
  }
}
