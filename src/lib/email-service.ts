// src/lib/email-service.ts
import nodemailer from 'nodemailer';
import type { DigestContent } from '@/services/legalDigestService';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Creates a nodemailer transporter using environment variables
 */
function createTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const secure = port === 465;

  // Config audit — logged on every transporter creation so we can spot misconfiguration
  console.log(`[email] SMTP config — host:${host} port:${port} secure:${secure} user:${user ?? '(NOT SET)'} pass:${pass ? '(set)' : '(NOT SET)'}`);

  if (!user) console.error('[email] EMAIL_USER is not set — all sends will fail');
  if (!pass) console.error('[email] EMAIL_PASSWORD is not set — all sends will fail');
  if (!process.env.EMAIL_FROM && !user) console.warn('[email] EMAIL_FROM is not set — "from" address will be empty');

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

/**
 * Sends an email using nodemailer
 * @param options Email options including to, subject, and html content
 * @returns Object indicating success or failure
 */
export async function sendEmail(options: EmailOptions) {
  const { to, subject, html, from, replyTo, cc, bcc, attachments } = options;
  const startedAt = Date.now();

  console.log(`[email] Attempting send — to:"${to}" subject:"${subject}" cc:${cc?.join(',') ?? 'none'} bcc:${bcc?.join(',') ?? 'none'}`);

  try {
    const transporter = createTransporter();
    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const resolvedFrom = from || `"Wansom" <${fromAddress}>`;

    console.log(`[email] Connecting to SMTP — from:"${resolvedFrom}"`);

    const info = await transporter.sendMail({
      from: resolvedFrom,
      replyTo,
      to,
      cc,
      bcc,
      subject,
      html,
      attachments
    });

    const elapsed = Date.now() - startedAt;
    console.log(`[email] Sent OK — to:"${to}" subject:"${subject}" messageId:${info.messageId} accepted:${JSON.stringify(info.accepted)} rejected:${JSON.stringify(info.rejected)} elapsed:${elapsed}ms`);

    if (info.rejected && info.rejected.length > 0) {
      console.warn(`[email] Some recipients were rejected — rejected:${JSON.stringify(info.rejected)}`);
    }

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error: any) {
    const elapsed = Date.now() - startedAt;
    console.error(`[email] FAILED — to:"${to}" subject:"${subject}" elapsed:${elapsed}ms`);
    console.error(`[email] Error name:${error?.name} code:${error?.code} message:${error?.message}`);
    if (error?.response)  console.error(`[email] SMTP response: ${error.response}`);
    if (error?.responseCode) console.error(`[email] SMTP responseCode: ${error.responseCode}`);
    if (error?.command)   console.error(`[email] SMTP command that failed: ${error.command}`);
    console.error('[email] Full error:', error);

    return {
      success: false,
      error
    };
  }
}

/**
 * Sends a welcome email to a new user
 * @param user User object with email and name
 * @returns Result of sending the email
 */
export function sendWelcomeEmail(user: { email: string; fullName?: string | null; }) {
  console.log(`[email:welcome] Queuing welcome email — to:"${user.email}"`);
  const name = user.fullName || 'User';
  const subject = 'Welcome to Wansom AI - Do More Legal Work with Less';
  const email = user.email;
  
  // Create HTML email content
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #0a4b5e;
          padding: 20px;
          text-align: center;
        }
        .header img {
          max-width: 200px;
          height: auto;
        }
        .content {
          padding: 20px;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 15px;
          text-align: center;
          font-size: 12px;
          color: #666666;
        }
        h1 {
          color: #0a4b5e;
          margin-top: 0;
        }
        .feature {
          margin-bottom: 20px;
        }
        .feature h3 {
          color: #0a4b5e;
          margin-bottom: 5px;
        }
        .button {
          display: inline-block;
          background-color: #0a4b5e;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 10px;
        }
        .social-links {
          margin-top: 20px;
        }
        .social-links a {
          margin: 0 10px;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://wansom.ai/images/logo-dark.png" alt="Wansom Logo">
        </div>
        <div class="content">
          <h1>Welcome to Wansom, ${name}!</h1>
          
          <p>We're excited to help you save time on routine legal tasks so you can focus on high impact work</p>
          
          <p>Here's a qucik look at what you can do on the platform:</p>
          
          <div class="feature">
            <h3>🤖 Create and Train AI Associates</h3>
            <p>Boost your productivity with AI teammates specialized in specific legal tasks.Create,train and use AI associates that adapt to your work style and help you complete tasks faster</p>
          </div>
          <div class="feature">
            <h3>⚙️ Draft and Review Contracts</h3>
            <p>Never switch between different tools when working with a large set of documents. We have an inline editor to help you draft documents from scratch with AI or start from a professional template. review and compare different sets of documents with Ai to ensure you never miss any details</p>
          </div>
          
          <div class="feature">
            <h3>🔒Document Vault</h3>
            <p>Securely upload, share, and perform semantic searches across all your important legal documents.</p>
          </div>               
          <div class="feature">
            <h3>👥 Research Better</h3>
            <p>Get instant answers to complex legal questions with AI that searches through verified cases, statutes, and legal authorities in seconds.</p>
          </div>     
          <div class="feature">
            <h3>🔄 Integrations</h3>
            <p>Connect with Outlook, Google Calendar, ERP Databases, and other legal management tools to streamline your operations.</p>
          </div>
          
          <div class="feature">
            <h3>👥 Collaboration</h3>
            <p>Enjoy multi-user access, shared comments, and AI-powered team coordination to keep everyone on the same page.</p>
          </div>
          
          <p>Ready to get started?</p>
          
          <p><a href="https://wansom.ai/dashboard" class="button">Enter Your Workspace</a></p>
          
          <p>If you have any questions or need assistance, our support team is ready to help. Simply reply to this email or contact us at law@wansom.ai</p>
          
          <p>Best regards,<br>
          The Wansom Team</p>
        </div>
        <div class="footer">
          <p>© 2025 Wansom AI Ltd. All rights reserved.</p>
          <div class="social-links">
            <a href="https://x.com/wansom_ai">Twitter</a> |
            <a href="https://www.linkedin.com/company/wansom-ai">LinkedIn</a>
          </div>
          <p>You're receiving this email because you signed up for Wansom. If you prefer not to receive emails, you can <a href="https://wansom.ai/unsubscribe?email=${email}">unsubscribe</a>.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: user.email,
    subject,
    html,
  });
}

/**
 * Sends an organization invitation email
 * @param invitation Invitation details
 * @returns Result of sending the email
 */
export function sendInvitationEmail({
  email,
  inviterName,
  organizationName,
  role,
  inviteUrl
}: {
  email: string;
  inviterName: string;
  organizationName: string;
  role: string;
  inviteUrl: string;
}) {
  const subject = `Invitation to join ${organizationName} on Wansom`;

  // Create HTML email content
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #0a4b5e;
          padding: 20px;
          text-align: center;
        }
        .header img {
          max-width: 200px;
          height: auto;
        }
        .content {
          padding: 20px;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 15px;
          text-align: center;
          font-size: 12px;
          color: #666666;
        }
        h1 {
          color: white;
          margin-top: 0;
        }
        .button {
          display: inline-block;
          background-color: #0a4b5e;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 10px;
          font-weight: 600;
        }
        .info-box {
          background-color: #f0f9ff;
          border-left: 4px solid #0a4b5e;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://wansom.ai/images/logo-dark.png" alt="Wansom Logo">
        </div>
        <div class="content">
          <h2>Join ${organizationName} on Wansom AI</h2>

          <p>Hello,</p>

          <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on Wansom AI as a <strong>${role}</strong>.</p>

          <p>To accept this invitation, click the button below:</p>

          <p style="text-align: center;">
            <a href="${inviteUrl}" class="button">Accept Invitation</a>
          </p>

          <p>This invitation will expire in 7 days.</p>

          <p>If you already have a Wansom account, you'll be able to switch between organizations after accepting.</p>

          <p>If you don't have an account yet, you'll be able to create one when you accept the invitation.</p>

          <p>If you believe this invitation was sent in error, you can safely ignore it.</p>
        </div>
        <div class="footer">
          <p>© 2025 Wansom AI Ltd. All rights reserved.</p>
          <div class="social-links">
            <a href="https://x.com/wansom_ai">Twitter</a> |
            <a href="https://www.linkedin.com/company/wansom-ai">LinkedIn</a>
          </div>
          <p>You're receiving this email because someone invited you to join their organization on Wansom.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
  });
}

/**
 * Sends a notification email when a user accepts an invitation
 * @param details Notification details
 * @returns Result of sending the email
 */
export function sendInvitationAcceptedEmail({
  inviterEmail,
  inviterName,
  newMemberName,
  organizationName,
  role
}: {
  inviterEmail: string;
  inviterName: string;
  newMemberName: string;
  organizationName: string;
  role: string;
}) {
  const subject = `${newMemberName} has joined ${organizationName} on Wansom AI`;
  
  // Create HTML email content
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #0a4b5e;
          padding: 20px;
          text-align: center;
          color: white;
        }
        .content {
          padding: 20px;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 15px;
          text-align: center;
          font-size: 12px;
          color: #666666;
        }
        .success-box {
          background-color: #e6f7ee;
          border-left: 4px solid #00a86b;
          padding: 15px;
          margin: 20px 0;
        }
        .button {
          display: inline-block;
          background-color: #0a4b5e;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Invitation Accepted</h2>
        </div>
        <div class="content">
          <p>Hello ${inviterName},</p>
          
          <div class="success-box">
            <p><strong>${newMemberName}</strong> has accepted your invitation to join <strong>${organizationName}</strong> as a <strong>${role}</strong>.</p>
          </div>
          
          <p>They now have access to your organization's projects and resources according to their role permissions.</p>
          
          <p style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://wansom.ai'}/profile" class="button">Manage Team</a>
          </p>
          
          <p>Thank you for growing your team on Wansom!</p>
        </div>
        <div class="footer">
          <p>© 2025 Wansom AI Ltd. All rights reserved.</p>
          <div class="social-links">
            <a href="https://x.com/wansom_ai">Twitter</a> |
            <a href="https://www.linkedin.com/company/wansom-ai">LinkedIn</a>
          </div>
          <p>You're receiving this email because you signed up for Wansom. If you prefer not to receive emails, you can <a href="https://wansom.ai/contact">unsubscribe</a>.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: inviterEmail,
    subject,
    html,
  });
}

/**
 * Sends a project invitation email
 * @param details Project invitation details
 * @returns Result of sending the email
 */
export function sendProjectInvitationEmail({
  email,
  inviterName,
  projectName,
  organizationName,
  role,
  inviteUrl
}: {
  email: string;
  inviterName: string;
  projectName: string;
  organizationName: string;
  role: string;
  inviteUrl: string;
}) {
  const subject = `Invitation to join project: ${projectName}`;
  
  // Create HTML email content
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #0a4b5e;
          padding: 20px;
          text-align: center;
        }
        .content {
          padding: 20px;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 15px;
          text-align: center;
          font-size: 12px;
          color: #666666;
        }
        h1 {
          color: white;
          margin-top: 0;
        }
        .button {
          display: inline-block;
          background-color: #0a4b5e;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 10px;
        }
        .project-info {
          background-color: #f5f5f5;
          border-radius: 4px;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Project Invitation</h1>
        </div>
        <div class="content">
          <h2>You've been invited to a project!</h2>
          
          <p>Hello,</p>
          
          <p><strong>${inviterName}</strong> has invited you to join a project in <strong>${organizationName}</strong>.</p>
          
          <div class="project-info">
            <p><strong>Project:</strong> ${projectName}</p>
            <p><strong>Your Role:</strong> ${role}</p>
            <p><strong>Organization:</strong> ${organizationName}</p>
          </div>
          
          <p>To join this project, click the button below:</p>
          
          <p style="text-align: center;">
            <a href="${inviteUrl}" class="button">Join Project</a>
          </p>
          
          <p>This invitation will expire in 7 days.</p>
          
          <p>If you're not already a member of ${organizationName}, you'll need to join the organization first.</p>
        </div>
        <div class="footer">
          <p>© 2025 Wansom Ltd. All rights reserved.</p>
          <div class="social-links">
            <a href="https://x.com/wansom_ai">Twitter</a> |
            <a href="https://www.linkedin.com/company/wansom-ai">LinkedIn</a>
          </div>
          <p>You're receiving this email because you signed up for Wansom. If you prefer not to receive emails, you can <a href="https://wansom.ai/unsubscribe?email=${email}">unsubscribe</a>.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
  });
}

/**
 * Sends a notification email when a member's role is changed
 * @param details Role change notification details
 * @returns Result of sending the email
 */
export function sendRoleChangeEmail({
  memberEmail,
  memberName,
  organizationName,
  oldRole,
  newRole,
  changedByName
}: {
  memberEmail: string;
  memberName: string;
  organizationName: string;
  oldRole: string;
  newRole: string;
  changedByName: string;
}) {
  const subject = `Your role in ${organizationName} has been updated`;

  // Create HTML email content
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #0a4b5e;
          padding: 20px;
          text-align: center;
          color: white;
        }
        .content {
          padding: 20px;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 15px;
          text-align: center;
          font-size: 12px;
          color: #666666;
        }
        .info-box {
          background-color: #f0f9ff;
          border-left: 4px solid #0a4b5e;
          padding: 15px;
          margin: 20px 0;
        }
        .button {
          display: inline-block;
          background-color: #0a4b5e;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Role Updated</h2>
        </div>
        <div class="content">
          <p>Hello ${memberName},</p>

          <div class="info-box">
            <p><strong>${changedByName}</strong> has updated your role in <strong>${organizationName}</strong>.</p>
            <p><strong>Previous Role:</strong> ${oldRole}</p>
            <p><strong>New Role:</strong> ${newRole}</p>
          </div>

          <p>Your permissions and access levels have been updated to reflect your new role.</p>

          <p style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://wansom.ai'}/dashboard" class="button">Go to Dashboard</a>
          </p>

          <p>If you have questions about this change, please contact your organization administrator.</p>
        </div>
        <div class="footer">
          <p>© 2025 Wansom Ltd. All rights reserved.</p>
          <div class="social-links">
            <a href="https://x.com/wansom_ai">Twitter</a> |
            <a href="https://www.linkedin.com/company/wansom-ai">LinkedIn</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: memberEmail,
    subject,
    html,
  });
}

/**
 * Sends a notification email when a member is removed from an organization
 * @param details Member removal notification details
 * @returns Result of sending the email
 */
export function sendMemberRemovedEmail({
  memberEmail,
  memberName,
  organizationName,
  removedByName
}: {
  memberEmail: string;
  memberName: string;
  organizationName: string;
  removedByName: string;
}) {
  const subject = `You have been removed from ${organizationName}`;

  // Create HTML email content
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #0a4b5e;
          padding: 20px;
          text-align: center;
          color: white;
        }
        .content {
          padding: 20px;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 15px;
          text-align: center;
          font-size: 12px;
          color: #666666;
        }
        .warning-box {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
        }
        .button {
          display: inline-block;
          background-color: #0a4b5e;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Access Removed</h2>
        </div>
        <div class="content">
          <p>Hello ${memberName},</p>

          <div class="warning-box">
            <p><strong>${removedByName}</strong> has removed you from <strong>${organizationName}</strong>.</p>
          </div>

          <p>You no longer have access to this organization's projects and resources.</p>

          <p>If you still have access to other organizations on Wansom, you can continue using your personal account or switch to another organization.</p>

          <p style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://wansom.ai'}/dashboard" class="button">Go to Dashboard</a>
          </p>

          <p>If you believe this was done in error, please contact the organization administrator.</p>
        </div>
        <div class="footer">
          <p>© 2025 Wansom Ltd. All rights reserved.</p>
          <div class="social-links">
            <a href="https://x.com/wansom_ai">Twitter</a> |
            <a href="https://www.linkedin.com/company/wansom-ai">LinkedIn</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: memberEmail,
    subject,
    html,
  });
}
/**
 * Sends a confirmation email when a Teams plan payment is verified
 */
export function sendTeamUpgradeConfirmedEmail({
  email,
  userName,
  organizationName,
  planPrice,
  nextBillingDate,
}: {
  email: string;
  userName: string;
  organizationName: string;
  planPrice: string;
  nextBillingDate: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wansom.ai';
  const subject = 'Your Wansom Teams Plan is Active';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0a4b5e; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <img src="https://wansom.ai/images/logo-dark.png" alt="Wansom" style="max-width: 160px; height: auto;">
          <h1 style="color: white; font-size: 22px; margin: 12px 0 4px 0;">Teams Plan Activated</h1>
        </div>

        <div style="background-color: white; padding: 28px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 15px;">Hello ${userName},</p>

          <div style="background-color: #e6f7ee; border-left: 4px solid #00a86b; padding: 16px; margin: 16px 0; border-radius: 0 6px 6px 0;">
            <p style="margin: 0; font-size: 15px; font-weight: 600; color: #00a86b;">Your Teams plan for <strong>${organizationName}</strong> is now active!</p>
          </div>

          <h3 style="color: #0a4b5e; font-size: 15px;">What's included</h3>
          <ul style="padding-left: 20px; color: #4a4a4a; font-size: 14px;">
            <li>Everything in the Personal plan</li>
            <li>Invite unlimited team members (${planPrice} per seat)</li>
            <li>Role-based access control</li>
            <li>Unlimited AI Associates</li>
            <li>Up to 50 GB Vault Storage</li>
            <li>Custom workflows &amp; integrations</li>
            <li>Priority support</li>
          </ul>

          <div style="background-color: #f8fafc; padding: 14px; border-radius: 6px; margin: 20px 0; font-size: 14px;">
            <p style="margin: 0 0 6px 0;"><strong>Billing:</strong> ${planPrice}</p>
            <p style="margin: 0;"><strong>Next renewal:</strong> ${nextBillingDate}</p>
          </div>

          <p style="font-size: 14px; color: #4a4a4a;">
            New seats are billed on a prorated basis when a team member accepts your invitation.
            Removing a member reduces your seat count at the next renewal.
          </p>

          <div style="margin-top: 24px; text-align: center;">
            <a href="${appUrl}/profile" style="display: inline-block; background-color: #0a4b5e; color: white; padding: 10px 24px; text-decoration: none; border-radius: 4px; font-weight: 600;">Invite Team Members</a>
          </div>
        </div>

        <div style="text-align: center; padding: 16px; font-size: 12px; color: #666666;">
          <p>&copy; ${new Date().getFullYear()} Wansom AI Ltd. All rights reserved.</p>
          <p>
            <a href="https://x.com/wansom_ai" style="color: #666; text-decoration: none;">Twitter</a> |
            <a href="https://www.linkedin.com/company/wansom-ai" style="color: #666; text-decoration: none;">LinkedIn</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Notifies the organization owner that a new seat was billed when a member accepted an invitation
 */
export function sendSeatBilledEmail({
  ownerEmail,
  ownerName,
  newMemberEmail,
  amount,
  organizationName,
  newSeatCount,
  nextBillingDate,
}: {
  ownerEmail: string;
  ownerName: string;
  newMemberEmail: string;
  amount: string;
  organizationName: string;
  newSeatCount: number;
  nextBillingDate: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wansom.ai';
  const subject = 'New team member added — seat charged';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0a4b5e; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <img src="https://wansom.ai/images/logo-dark.png" alt="Wansom" style="max-width: 160px; height: auto;">
          <h1 style="color: white; font-size: 22px; margin: 12px 0 4px 0;">New Seat Added</h1>
        </div>

        <div style="background-color: white; padding: 28px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 15px;">Hello ${ownerName},</p>

          <p style="font-size: 14px; color: #4a4a4a;">
            A new member has joined <strong>${organizationName}</strong> and a prorated seat charge has been applied to your payment method.
          </p>

          <div style="background-color: #f0f9ff; border-left: 4px solid #0a4b5e; padding: 16px; margin: 16px 0; border-radius: 0 6px 6px 0; font-size: 14px;">
            <p style="margin: 0 0 6px 0;"><strong>New member:</strong> ${newMemberEmail}</p>
            <p style="margin: 0 0 6px 0;"><strong>Prorated charge:</strong> ${amount}</p>
            <p style="margin: 0 0 6px 0;"><strong>Total seats:</strong> ${newSeatCount}</p>
            <p style="margin: 0;"><strong>Next renewal:</strong> ${nextBillingDate} (${newSeatCount} seats × $15/seat)</p>
          </div>

          <p style="font-size: 13px; color: #666;">
            Seat charges are prorated for the remaining days in your current billing cycle.
            Removing a member before the renewal date reduces your seat count at next renewal — no immediate refund.
          </p>

          <div style="margin-top: 24px; text-align: center;">
            <a href="${appUrl}/profile" style="display: inline-block; background-color: #0a4b5e; color: white; padding: 10px 24px; text-decoration: none; border-radius: 4px; font-weight: 600;">Manage Team</a>
          </div>
        </div>

        <div style="text-align: center; padding: 16px; font-size: 12px; color: #666666;">
          <p>&copy; ${new Date().getFullYear()} Wansom AI Ltd. All rights reserved.</p>
          <p>
            <a href="https://x.com/wansom_ai" style="color: #666; text-decoration: none;">Twitter</a> |
            <a href="https://www.linkedin.com/company/wansom-ai" style="color: #666; text-decoration: none;">LinkedIn</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: ownerEmail, subject, html });
}

/**
 * Sends an email to admin for upgrade approval
 * @param details Upgrade request details
 * @returns Result of sending the email
 */
export function sendUpgradeApprovalEmail({
  adminEmail,
  organizationName,
  requesterName,
  requesterEmail,
  approvalUrl
}: {
  adminEmail: string;
  organizationName: string;
  requesterName: string;
  requesterEmail: string;
  approvalUrl: string;
}) {
  const subject = `Upgrade Request: ${organizationName} wants to upgrade to Enterprise`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #0a4b5e;
          padding: 20px;
          text-align: center;
          color: white;
        }
        .content {
          padding: 20px;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 15px;
          text-align: center;
          font-size: 12px;
          color: #666666;
        }
        .info-box {
          background-color: #f0f9ff;
          border-left: 4px solid #0a4b5e;
          padding: 15px;
          margin: 20px 0;
        }
        .button {
          display: inline-block;
          background-color: #0a4b5e;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 10px;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Enterprise Upgrade Request</h2>
        </div>
        <div class="content">
          <p>Hello Admin,</p>

          <div class="info-box">
            <p><strong>${requesterName}</strong> (${requesterEmail}) has requested to upgrade <strong>${organizationName}</strong> to Enterprise plan.</p>
          </div>

          <p><strong>Enterprise Features Include:</strong></p>
          <ul>
            <li>Invite unlimited team members</li>
            <li>Role-based access control</li>
            <li>Advanced collaboration features</li>
            <li>Priority support</li>
          </ul>

          <p>To approve this upgrade request, click the button below:</p>

          <p style="text-align: center;">
            <a href="${approvalUrl}" class="button">Approve Upgrade</a>
          </p>

          <p style="font-size: 12px; color: #666;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${approvalUrl}">${approvalUrl}</a>
          </p>

          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <strong>Organization Details:</strong><br>
            Name: ${organizationName}<br>
            Requested by: ${requesterName}<br>
            Email: ${requesterEmail}
          </p>
        </div>
        <div class="footer">
          <p>© 2025 Wansom Ltd. All rights reserved.</p>
          <div class="social-links">
            <a href="https://x.com/wansom_ai">Twitter</a> |
            <a href="https://www.linkedin.com/company/wansom-ai">LinkedIn</a>
          </div>
          <p>This is an automated notification from Wansom.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject,
    html,
  });
}

/**
 * Sends a password reset email to the user
 * @param details Password reset email details
 * @returns Result of sending the email
 */
export function sendPasswordResetEmail({
  email,
  fullName,
  resetUrl
}: {
  email: string;
  fullName?: string | null;
  resetUrl: string;
}) {
  const name = fullName || 'there';
  const subject = 'Reset Your Password - Wansom';

  // Create HTML email content
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .content {
          padding: 20px;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 15px;
          text-align: center;
          font-size: 12px;
          color: #666666;
        }
        .warning-box {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
        }
        .button {
          display: inline-block;
          background-color: #0a4b5e;
          color: white !important;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 10px;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <p>Hello ${name},</p>

          <p>We received a request to reset your password for your Wansom account.</p>

          <p>To reset your password, click the button below:</p>

          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>

          <div class="warning-box">
            <p><strong>Security Notice:</strong> This link will expire in 1 hour for your protection. If you didn't request a password reset, you can safely ignore this email.</p>
          </div>

          <p style="font-size: 12px; color: #666; margin-top: 30px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}">${resetUrl}</a>
          </p>

          <p style="margin-top: 30px;">
            Best regards,<br>
            The Wansom Team
          </p>
        </div>
        <div class="footer">
          <p>© 2025 Wansom Ltd. All rights reserved.</p>
          <div class="social-links">
            <a href="https://x.com/wansom_ai">Twitter</a> |
            <a href="https://www.linkedin.com/company/wansom-ai">LinkedIn</a>
          </div>
          <p>You're receiving this email because a password reset was requested for your account.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
  });
}

/**
 * Sends a Briefly by Wansom welcome email with credentials and subscription summary
 */
export function sendLaw360WelcomeEmail({
  email,
  fullName,
  password,
  frequency,
  jurisdictions,
  topics,
}: {
  email: string;
  fullName: string;
  password: string;
  frequency: string;
  jurisdictions: string[];
  topics: string[];
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wansom.ai';
  const loginUrl = `${appUrl}/login`;
  const manageUrl = `${appUrl}/workflows/template/briefly-by-wansom`;
  const frequencyLabel = frequency === 'daily' ? 'Daily' : 'Weekly';

  const subject = `Welcome to Briefly by Wansom - Your Login Credentials`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0a4b5e; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <img src="https://wansom.ai/images/logo-dark.png" alt="Wansom" style="max-width: 160px; height: auto;">
          <h1 style="color: white; font-size: 24px; margin: 12px 0 4px 0;">Welcome to Briefly by Wansom</h1>
        </div>

        <div style="background-color: white; padding: 28px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 15px;">Hello ${fullName},</p>

          <p>Your Briefly by Wansom subscription has been activated! Here are your login credentials:</p>

          <div style="background-color: #f0f9ff; border-left: 4px solid #0a4b5e; padding: 16px; margin: 16px 0; border-radius: 0 6px 6px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 0; font-size: 14px;"><strong>Password:</strong> ${password}</p>
          </div>

          <p style="color: #dc2626; font-size: 13px;">Please change your password after your first login for security.</p>

          <h3 style="color: #0a4b5e; font-size: 15px; margin-top: 24px;">Your Subscription</h3>
          <div style="background-color: #f8fafc; padding: 14px; border-radius: 6px; margin-bottom: 16px;">
            <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>Frequency:</strong> ${frequencyLabel}</p>
            <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>Jurisdictions:</strong> ${jurisdictions.join(', ')}</p>
            <p style="margin: 0; font-size: 14px;"><strong>Topics:</strong> ${topics.join(', ')}</p>
          </div>

          <div style="margin-top: 24px; text-align: center;">
            <a href="${loginUrl}" style="display: inline-block; background-color: #0a4b5e; color: white; padding: 10px 24px; text-decoration: none; border-radius: 4px; font-weight: 600; margin-right: 8px;">Login to Dashboard</a>
            <a href="${manageUrl}" style="display: inline-block; background-color: white; color: #0a4b5e; padding: 10px 24px; text-decoration: none; border-radius: 4px; font-weight: 600; border: 1px solid #0a4b5e;">Manage Subscription</a>
          </div>
        </div>

        <div style="text-align: center; padding: 16px; font-size: 12px; color: #666666;">
          <p>&copy; ${new Date().getFullYear()} Wansom AI Ltd. All rights reserved.</p>
          <p>
            <a href="https://x.com/wansom_ai" style="color: #666; text-decoration: none;">Twitter</a> |
            <a href="https://www.linkedin.com/company/wansom-ai" style="color: #666; text-decoration: none;">LinkedIn</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
  });
}

/**
 * Sends a confirmation email when a user subscribes to Briefly by Wansom
 */
export async function sendDigestSubscriptionEmail({
  email,
  fullName,
  frequency,
  jurisdictions,
  topics,
}: {
  email: string;
  fullName: string;
  frequency: string;
  jurisdictions: string[];
  topics: string[];
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wansom.ai';
  const manageUrl = `${appUrl}/workflows/template/law-360`;
  const frequencyLabel = frequency === 'daily' ? 'Daily' : 'Weekly';

  const subject = `You're subscribed to ${frequencyLabel} Briefly by Wansom`;

  const jurisdictionsList = jurisdictions.map(
    (j) => `<li style="margin-bottom:4px">${j}</li>`
  ).join('');
  const topicsList = topics.map(
    (t) => `<li style="margin-bottom:4px">${t}</li>`
  ).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0a4b5e; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <img src="https://wansom.ai/images/logo-dark.png" alt="Wansom" style="max-width: 160px; height: auto;">
          <h1 style="color: white; font-size: 24px; margin: 12px 0 4px 0;">Briefly by Wansom</h1>
        </div>

        <div style="background-color: white; padding: 28px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 15px;">Hello ${fullName},</p>

          <p>You've successfully subscribed to <strong>Briefly by Wansom</strong>, your personalized legal news digest powered by Wansom AI.</p>

          <div style="background-color: #f0f9ff; border-left: 4px solid #0a4b5e; padding: 16px; border-radius: 0 6px 6px 0; margin: 20px 0;">
            <p style="margin: 0 0 12px 0; font-weight: 600; color: #0a4b5e;">Your subscription</p>
            <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Frequency:</strong> ${frequencyLabel}</p>
            <div style="display: flex; gap: 24px; margin-top: 12px; flex-wrap: wrap;">
              <div>
                <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600;">Jurisdictions</p>
                <ul style="padding-left: 18px; margin: 0; color: #4a4a4a; font-size: 14px;">${jurisdictionsList}</ul>
              </div>
              <div>
                <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600;">Practice Areas</p>
                <ul style="padding-left: 18px; margin: 0; color: #4a4a4a; font-size: 14px;">${topicsList}</ul>
              </div>
            </div>
          </div>

          <p>Your first digest will arrive ${frequency === 'daily' ? 'tomorrow morning' : 'next Monday morning'} at 09:30 EAT.</p>

          <div style="margin-top: 24px; text-align: center;">
            <a href="${manageUrl}" style="display: inline-block; background-color: #0a4b5e; color: white; padding: 10px 24px; text-decoration: none; border-radius: 4px; font-weight: 600;">Manage Subscription</a>
          </div>
        </div>

        <div style="text-align: center; padding: 16px; font-size: 12px; color: #666666;">
          <p>&copy; ${new Date().getFullYear()} Wansom AI Ltd. All rights reserved.</p>
          <p>
            <a href="https://x.com/wansom_ai" style="color: #666; text-decoration: none;">Twitter</a> |
            <a href="https://www.linkedin.com/company/wansom-ai" style="color: #666; text-decoration: none;">LinkedIn</a>
          </p>
          <p>You're receiving this because you subscribed to Briefly by Wansom.</p>
          <p><a href="${manageUrl}" style="color: #0a4b5e;">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
  });
}

/**
 * Sends a legal news digest email
 */
export async function sendLegalDigestEmail({
  email,
  fullName,
  digest,
  frequency,
  isPreview = false,
}: {
  email: string;
  fullName: string;
  digest: DigestContent;
  frequency: string;
  isPreview?: boolean;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wansom.ai';
  const unsubscribeUrl = `${appUrl}/workflows/template/law-360`;
  const frequencyLabel = frequency === 'daily' ? 'Daily' : 'Weekly';
  const todayShort = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const subject = isPreview
    ? `[PREVIEW] Briefly by Wansom — ${frequencyLabel} Digest · ${todayShort}`
    : `Briefly by Wansom ${frequencyLabel} Digest · ${todayShort}: ${digest.headline}`;

  const sectionsHtml = digest.sections
    .filter((s) => s.items.length > 0)
    .map(
      (section) => `
      <div style="margin-bottom: 28px;">
        <h2 style="color: #0a4b5e; font-size: 18px; border-bottom: 2px solid #0a4b5e; padding-bottom: 8px; margin-bottom: 16px;">
          ${section.category}
        </h2>
        ${section.items
          .map(
            (item) => `
          ${(() => {
              const cardStyle = 'display:block;margin-bottom:16px;padding:12px;background-color:#f8fafc;border-radius:6px;border-left:3px solid #0a4b5e;text-decoration:none;color:inherit;';
              const inner = `
                <h3 style="color:#1a1a1a;font-size:15px;margin:0 0 6px 0;">${item.title}</h3>
                <p style="color:#4a4a4a;font-size:14px;line-height:1.5;margin:0 0 8px 0;">${item.summary}${item.sourceUrl ? ` <span style="color:#0a4b5e;font-weight:600;text-decoration:underline;">Read more &rarr;</span>` : ''}</p>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                  ${item.sourceName ? `<span style="color:#0a4b5e;font-size:13px;">${item.sourceName}</span>` : ''}
                  ${item.backdatedLabel ? `<span style="display:inline-block;background:#fff7ed;border:1px solid #fdba74;color:#9a3412;font-size:11px;padding:1px 8px;border-radius:10px;white-space:nowrap;">&#128337; ${item.backdatedLabel}</span>` : ''}
                </div>
              `;
              return item.sourceUrl
                ? `<a href="${item.sourceUrl}" style="${cardStyle}">${inner}</a>`
                : `<div style="${cardStyle}">${inner}</div>`;
            })()}`
          )
          .join('')}
      </div>`
    )
    .join('');

  const sourcesHtml =
    digest.sources.length > 0
      ? `
    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e5e5;">
      <h3 style="color: #666; font-size: 14px; margin-bottom: 8px;">Sources</h3>
      <ul style="list-style: none; padding: 0; margin: 0;">
        ${digest.sources
          .map(
            (s) =>
              `<li style="margin-bottom: 4px;"><a href="${s.url}" style="color: #0a4b5e; font-size: 13px; text-decoration: none;">${s.title}</a></li>`
          )
          .join('')}
      </ul>
    </div>`
      : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 640px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0a4b5e; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <img src="https://wansom.ai/images/logo-dark.png" alt="Wansom" style="max-width: 160px; height: auto;">
          <h1 style="color: white; font-size: 22px; margin: 12px 0 4px 0;">Briefly by Wansom - ${frequencyLabel}</h1>
          <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div style="background-color: white; padding: 28px; border-radius: 0 0 8px 8px;">
          ${isPreview ? `
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 600;">This is a preview — the real thing looks exactly like this.</p>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #92400e;">Once you subscribe, you'll receive your personalised digest every ${frequencyLabel.toLowerCase()}. <a href="${appUrl}/briefly-by-wansom" style="color: #0a4b5e; font-weight: 600;">Activate Briefly &rarr;</a></p>
          </div>` : ''}


          <p style="font-size: 15px;">Hello ${fullName},</p>

          <div style="background-color: #f0f9ff; border-left: 4px solid #0a4b5e; padding: 14px; margin: 16px 0; border-radius: 0 6px 6px 0;">
            <p style="margin: 0; font-size: 15px; font-weight: 600; color: #0a4b5e;">${digest.headline}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #4a4a4a;">${digest.summary}</p>
          </div>

          ${sectionsHtml || `
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 28px 24px; text-align: center; margin: 24px 0;">
            <p style="font-size: 22px; margin: 0 0 8px 0;">📭</p>
            <p style="font-size: 15px; font-weight: 600; color: #1a1a1a; margin: 0 0 8px 0;">No updates found for this period</p>
            <p style="font-size: 14px; color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0;">
              Briefly searched your selected jurisdictions and practice areas but could not find enough legal content for this window — even after looking back further than usual.<br><br>
              You can improve your digest by <strong>adding more jurisdictions</strong> or <strong>selecting additional practice areas</strong>. The more sources you cover, the more reliably Briefly can keep you informed.
            </p>
            <a href="${appUrl}/briefly-by-wansom"
               style="display: inline-block; background-color: #0a4b5e; color: white; padding: 10px 24px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 600;">
              Update my Briefly settings &rarr;
            </a>
          </div>`}
          ${sourcesHtml}

          <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center;">
            <a href="${appUrl}/dashboard" style="display: inline-block; background-color: #0a4b5e; color: white; padding: 10px 24px; text-decoration: none; border-radius: 4px; font-weight: 600;">Open Wansom Workspace</a>
          </div>
        </div>

        <div style="text-align: center; padding: 16px; font-size: 12px; color: #666666;">
          <p>&copy; ${new Date().getFullYear()} Wansom AI Ltd. All rights reserved.</p>
          <p>
            <a href="https://x.com/wansom_ai" style="color: #666; text-decoration: none;">Twitter</a> |
            <a href="https://www.linkedin.com/company/wansom-ai" style="color: #666; text-decoration: none;">LinkedIn</a>
          </p>
          <p>You're receiving this because you subscribed to Briefly by Wansom.</p>
          <p><a href="${unsubscribeUrl}" style="color: #0a4b5e;">Manage subscription</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
  });
}


/**
 * Sends an email verification email
 */
export function sendVerificationEmail(user: { email: string; fullName?: string | null }, verificationUrl: string) {
  console.log(`[email:verification] Queuing verification email — to:"${user.email}" url:"${verificationUrl}"`);
  const name = user.fullName?.split(' ')[0] || 'there';
  const subject = 'Verify your email — Wansom AI';
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td bgcolor="#0a4b5e" style="background:linear-gradient(135deg,#0a4b5e,#005c4d);padding:28px 40px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Wansom <span style="color:#7ee8c8;">AI</span></p>
            <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.55);letter-spacing:1.5px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Legal Intelligence Platform</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 28px;">
            <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#18181b;">Hi ${name} 👋</p>
            <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.7;">You're almost ready! Please confirm your email address so we know it's really you. This keeps your workspace secure and unlocks all features.</p>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 28px;">
              <tr>
                <td align="center" bgcolor="#0a4b5e" style="background:linear-gradient(135deg,#0a4b5e,#005c4d);border-radius:8px;">
                  <a href="${verificationUrl}" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.2px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Verify my email &#8594;</a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 6px;font-size:13px;color:#71717a;">Button not working? Copy and paste this link into your browser:</p>
            <p style="margin:0 0 24px;font-size:12px;color:#0a4b5e;word-break:break-all;">${verificationUrl}</p>

            <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 20px;"/>
            <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.6;">This link expires in <strong style="color:#71717a;">24 hours</strong>. If you didn't create a Wansom AI account, you can safely ignore this email.</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:18px 40px;background:#fafafa;border-top:1px solid #f0f0f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#a1a1aa;">Wansom AI &nbsp;&middot;&nbsp; Legal Intelligence Platform &nbsp;&middot;&nbsp; <a href="mailto:support@wansom.ai" style="color:#a1a1aa;text-decoration:none;">support@wansom.ai</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return sendEmail({ to: user.email, subject, html });
}

/**
 * Sends a trial expiry notification email to the org owner
 */
export function sendTrialExpiryEmail(user: { email: string; fullName?: string | null }, orgName: string) {
  const name = user.fullName || 'there';
  const appUrl = process.env.NEXTAUTH_URL || 'https://wansom.ai';
  const upgradeUrl = `${appUrl}/profile`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr>
          <td style="background:#0a4b5e;padding:28px 40px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Wansom AI</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="margin:0 0 16px;color:#0a4b5e;font-size:20px;">Your Pro trial has ended, ${name}</h2>
            <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
              Your 15-day Pro trial for <strong>${orgName}</strong> has expired. Your account has been returned to the free plan.
            </p>
            <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
              All your documents, projects, and conversation history are safe and untouched. To continue enjoying unlimited AI responses, AI Associates, and all Pro features, upgrade to a paid plan today.
            </p>

            <!-- Feature recap -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:6px;padding:20px;margin-bottom:28px;">
              <tr><td>
                <p style="margin:0 0 10px;color:#0a4b5e;font-weight:700;font-size:14px;">What you had with Pro:</p>
                <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:2;">
                  <li>Unlimited client/matter workspaces</li>
                  <li>Unlimited AI responses</li>
                  <li>Draft &amp; review unlimited contracts</li>
                  <li>Multi-jurisdiction research</li>
                  <li>AI Associates &amp; custom workflows</li>
                </ul>
              </td></tr>
            </table>

            <a href="${upgradeUrl}" style="display:inline-block;background:#d97706;color:#ffffff;padding:13px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:15px;">Upgrade to Pro Now</a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:18px 40px;background:#fafafa;border-top:1px solid #f0f0f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#a1a1aa;">Wansom AI &nbsp;&middot;&nbsp; Legal Intelligence Platform &nbsp;&middot;&nbsp; <a href="mailto:support@wansom.ai" style="color:#a1a1aa;text-decoration:none;">support@wansom.ai</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: user.email,
    subject: 'Your Wansom AI Pro trial has ended — upgrade to keep going',
    html,
  });
}

/**
 * Sends a trial-start email to the org owner when manually upgraded by an admin.
 */
export function sendTrialStartEmail(
  user: { email: string; fullName?: string | null },
  orgName: string,
  trialExpiresAt: Date
) {
  const name = user.fullName || 'there';
  const appUrl = process.env.NEXTAUTH_URL || 'https://wansom.ai';
  const upgradeUrl = `${appUrl}/profile`;
  const expiryDateStr = trialExpiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr>
          <td style="background:#0a4b5e;padding:28px 40px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Wansom AI</h1>
          </td>
        </tr>

        <!-- Hero -->
        <tr>
          <td style="background:linear-gradient(135deg,#d97706,#f59e0b);padding:32px 40px;text-align:center;">
            <p style="margin:0 0 6px;color:#ffffff;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Pro Access Activated</p>
            <h2 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;">Your 15-day Pro trial has started!</h2>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
              Hi ${name},
            </p>
            <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
              Great news — <strong>${orgName}</strong> has been granted full Pro access on Wansom AI.
              You have <strong>15 days</strong> to explore everything the platform has to offer.
            </p>

            <!-- Expiry callout -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;margin-bottom:28px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;color:#92400e;font-size:14px;">
                    ⏳ &nbsp;<strong>Trial expires on ${expiryDateStr}.</strong>
                    Upgrade to a paid plan before then to keep uninterrupted access.
                  </p>
                </td>
              </tr>
            </table>

            <!-- Feature list -->
            <p style="margin:0 0 12px;color:#0a4b5e;font-weight:700;font-size:14px;">What you can do during your trial:</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td style="padding:4px 0;color:#374151;font-size:14px;">✅ &nbsp;Unlimited client/matter workspaces</td></tr>
              <tr><td style="padding:4px 0;color:#374151;font-size:14px;">✅ &nbsp;Unlimited AI responses</td></tr>
              <tr><td style="padding:4px 0;color:#374151;font-size:14px;">✅ &nbsp;Draft &amp; review unlimited contracts</td></tr>
              <tr><td style="padding:4px 0;color:#374151;font-size:14px;">✅ &nbsp;Multi-jurisdiction legal research</td></tr>
              <tr><td style="padding:4px 0;color:#374151;font-size:14px;">✅ &nbsp;AI Associates &amp; custom workflows</td></tr>
              <tr><td style="padding:4px 0;color:#374151;font-size:14px;">✅ &nbsp;Google Calendar &amp; Email integrations</td></tr>
            </table>

            <a href="${upgradeUrl}" style="display:inline-block;background:#0a4b5e;color:#ffffff;padding:13px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:15px;">Go to My Account</a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:18px 40px;background:#fafafa;border-top:1px solid #f0f0f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#a1a1aa;">Wansom AI &nbsp;&middot;&nbsp; Legal Intelligence Platform &nbsp;&middot;&nbsp; <a href="mailto:support@wansom.ai" style="color:#a1a1aa;text-decoration:none;">support@wansom.ai</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: user.email,
    subject: `Your Wansom AI Pro trial is live — expires ${expiryDateStr}`,
    html,
  });
}
