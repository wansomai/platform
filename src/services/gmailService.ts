// src/services/gmailService.ts
import { google } from 'googleapis';
import { getGoogleOAuthClient } from '@/lib/googleOAuth';

export interface EmailMessage {
  id: string;
  from: string;
  to?: string[];
  subject: string;
  snippet: string;
  body?: string;
  date: string;
  labels?: string[];
}

export interface SearchEmailsParams {
  query: string;
  maxResults?: number;
}

export interface DraftEmailParams {
  to: string[];
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
}

export class GmailService {
  /**
   * Search for emails in user's Gmail
   */
  static async searchEmails(userId: string, params: SearchEmailsParams): Promise<EmailMessage[]> {
    try {
      const auth = await getGoogleOAuthClient(userId);
      if (!auth) {
        throw new Error('No Google account connected. Please sign in with Google to use Gmail features.');
      }

      const gmail = google.gmail({ version: 'v1', auth });

      // Search for messages
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: params.query,
        maxResults: Math.min(params.maxResults || 10, 50),
      });

      const messages = response.data.messages || [];

      if (messages.length === 0) {
        return [];
      }

      // Fetch full message details for each message
      const emailPromises = messages.map(async (message) => {
        const messageData = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full',
        });

        const msg = messageData.data;
        const headers = msg.payload?.headers || [];

        // Extract headers
        const getHeader = (name: string) => {
          const header = headers.find(h => h.name?.toLowerCase() === name.toLowerCase());
          return header?.value || '';
        };

        return {
          id: msg.id!,
          from: getHeader('From'),
          to: getHeader('To').split(',').map(e => e.trim()).filter(Boolean),
          subject: getHeader('Subject'),
          snippet: msg.snippet || '',
          date: getHeader('Date'),
          labels: msg.labelIds || [],
        };
      });

      return await Promise.all(emailPromises);
    } catch (error: any) {
      console.error('Error searching emails:', error);
      throw new Error(`Failed to search emails: ${error.message}`);
    }
  }

  /**
   * Read full email content by ID
   */
  static async readEmail(userId: string, emailId: string): Promise<EmailMessage> {
    try {
      const auth = await getGoogleOAuthClient(userId);
      if (!auth) {
        throw new Error('No Google account connected. Please sign in with Google to use Gmail features.');
      }

      const gmail = google.gmail({ version: 'v1', auth });

      const response = await gmail.users.messages.get({
        userId: 'me',
        id: emailId,
        format: 'full',
      });

      const msg = response.data;
      const headers = msg.payload?.headers || [];

      // Extract headers
      const getHeader = (name: string) => {
        const header = headers.find(h => h.name?.toLowerCase() === name.toLowerCase());
        return header?.value || '';
      };

      // Extract email body
      let body = '';
      const parts = msg.payload?.parts || [];

      // Try to get plain text body first
      const textPart = parts.find(part => part.mimeType === 'text/plain');
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
      } else {
        // Fall back to HTML body
        const htmlPart = parts.find(part => part.mimeType === 'text/html');
        if (htmlPart?.body?.data) {
          body = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
        } else if (msg.payload?.body?.data) {
          // Single part message
          body = Buffer.from(msg.payload.body.data, 'base64').toString('utf-8');
        }
      }

      return {
        id: msg.id!,
        from: getHeader('From'),
        to: getHeader('To').split(',').map(e => e.trim()).filter(Boolean),
        subject: getHeader('Subject'),
        snippet: msg.snippet || '',
        body,
        date: getHeader('Date'),
        labels: msg.labelIds || [],
      };
    } catch (error: any) {
      console.error('Error reading email:', error);
      throw new Error(`Failed to read email: ${error.message}`);
    }
  }

  /**
   * Create a draft email
   */
  static async draftEmail(userId: string, params: DraftEmailParams): Promise<{ draftId: string; message: string }> {
    try {
      const auth = await getGoogleOAuthClient(userId);
      if (!auth) {
        throw new Error('No Google account connected. Please sign in with Google to use Gmail features.');
      }

      const gmail = google.gmail({ version: 'v1', auth });

      // Create email message in RFC 2822 format
      const messageParts = [
        `To: ${params.to.join(', ')}`,
        params.cc && params.cc.length > 0 ? `Cc: ${params.cc.join(', ')}` : '',
        params.bcc && params.bcc.length > 0 ? `Bcc: ${params.bcc.join(', ')}` : '',
        `Subject: ${params.subject}`,
        '',
        params.body
      ].filter(Boolean).join('\n');

      const encodedMessage = Buffer.from(messageParts)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: {
            raw: encodedMessage,
          },
        },
      });

      return {
        draftId: response.data.id!,
        message: 'Draft email created successfully',
      };
    } catch (error: any) {
      console.error('Error creating draft email:', error);
      throw new Error(`Failed to create draft email: ${error.message}`);
    }
  }
}
