import nodemailer from 'nodemailer';

/**
 * Shared email transporter for sending notification emails.
 * Configure via environment variables:
 * - EMAIL_HOST: SMTP host (defaults to smtp.gmail.com)
 * - EMAIL_PORT: SMTP port (defaults to 587)
 * - EMAIL_USER: SMTP username
 * - EMAIL_PASSWORD: SMTP password
 */
export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: false,
  auth: {
    
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Get notification email recipients from environment variables.
 * Falls back to empty array if not configured.
 *
 * Configure via NOTIFICATION_EMAILS environment variable:
 * Example: NOTIFICATION_EMAILS=email1@example.com,email2@example.com
 */
export function getNotificationEmails(): string[] {
  const emails = process.env.NOTIFICATION_EMAILS;
  if (!emails) {
    console.warn('NOTIFICATION_EMAILS environment variable is not set');
    return [];
  }
  return emails.split(',').map(email => email.trim()).filter(Boolean);
}

/**
 * Get the sender email address from environment variables.
 * Falls back to EMAIL_USER if NOTIFICATION_FROM is not set.
 */
export function getNotificationFromEmail(): string {
  return process.env.NOTIFICATION_FROM || process.env.EMAIL_USER || '';
}
