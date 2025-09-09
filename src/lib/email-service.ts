// src/lib/email-service.ts
import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
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
  // Get email credentials from environment variables
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  
  if (!user || !pass) {
    // Email credentials not found in environment variables
  }
  
  // Create a transporter
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Sends an email using nodemailer
 * @param options Email options including to, subject, and html content
 * @returns Object indicating success or failure
 */
export async function sendEmail(options: EmailOptions) {
  const { to, subject, html, from, cc, bcc, attachments } = options;
  
  try {
    const transporter = createTransporter();
    const user = process.env.EMAIL_USER;
    
    // Send email
    const info = await transporter.sendMail({
      from: from || `"Wansom" <${user}>`,
      to,
      cc,
      bcc,
      subject,
      html,
      attachments
    });
    
    return { 
      success: true, 
      messageId: info.messageId 
    };
  } catch (error) {
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
  const name = user.fullName || 'there';
  const subject = 'Welcome to Wansom - Your AI-powered Legal Workspace';
  
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
          background-color: #005c4d;
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
          color: #005c4d;
          margin-top: 0;
        }
        .feature {
          margin-bottom: 20px;
        }
        .feature h3 {
          color: #005c4d;
          margin-bottom: 5px;
        }
        .button {
          display: inline-block;
          background-color: #005c4d;
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
          
          <p>Thank you for joining Wansom, your new AI-powered legal workspace. We're excited to help you automate routine legal tasks.</p>
          
          <p>Here's what you can do with Wansom:</p>
          
          <div class="feature">
            <h3>🤖 AI Assistant</h3>
            <p>Our advanced legal AI can perform deep research with internet access, securely retrieve information from your company's proprietary data, and help with context-aware document drafting.</p>
          </div>
          
          <div class="feature">
            <h3>🔒 Vault</h3>
            <p>Securely upload, share, and perform semantic searches across all your important legal documents.</p>
          </div>
          
          <div class="feature">
            <h3>⚙️ Workflows</h3>
            <p>Automate repetitive tasks such as contract reviews, compliance checks, regulatory filings, email writing, and tax preparation.</p>
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
          <p>© 2025 Wansom Ltd. All rights reserved.</p>
          <p>Nairobi, Kenya</p>
          <div class="social-links">
            <a href="https://x.com/wansom_ai">Twitter</a> |
            <a href="https://www.linkedin.com/company/wansom-ai">LinkedIn</a>
          </div>
          <p>You're receiving this email because you signed up for Wansom. If you prefer not to receive emails, you can <a href="https://wansom.ai/unsubscribe?email=${user.email}">unsubscribe</a>.</p>
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
  const subject = `Invitation to join ${organizationName} on LegalAssist`;
  
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
          background-color: #005c4d;
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
          background-color: #005c4d;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 10px;
        }
        .info-box {
          background-color: #f5f5f5;
          border-left: 4px solid #005c4d;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You've Been Invited!</h1>
        </div>
        <div class="content">
          <h2>Join ${organizationName} on LegalAssist</h2>
          
          <p>Hello,</p>
          
          <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on LegalAssist as a <strong>${role}</strong>.</p>
          
          <div class="info-box">
            <p>LegalAssist is an AI-powered platform that helps legal professionals collaborate on projects, manage documents, and streamline workflows.</p>
          </div>
          
          <p>To accept this invitation, click the button below:</p>
          
          <p style="text-align: center;">
            <a href="${inviteUrl}" class="button">Accept Invitation</a>
          </p>
          
          <p>This invitation will expire in 7 days.</p>
          
          <p>If you already have a LegalAssist account, you'll be able to switch between organizations after accepting.</p>
          
          <p>If you don't have an account yet, you'll be able to create one when you accept the invitation.</p>
          
          <p>If you believe this invitation was sent in error, you can safely ignore it.</p>
        </div>
        <div class="footer">
          <p>© 2025 Wansom Ltd. All rights reserved.</p>
          <p>Nairobi, Kenya</p>
          <div class="social-links">
            <a href="https://x.com/wansom_ai">Twitter</a> |
            <a href="https://www.linkedin.com/company/wansom-ai">LinkedIn</a>
          </div>
          <p>You're receiving this email because you signed up for Wansom. If you prefer not to receive emails, you can <a href="https://wansom.ai/unsubscribe?email=${user.email}">unsubscribe</a>.</p>
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
  const subject = `${newMemberName} has joined ${organizationName} on LegalAssist`;
  
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
          background-color: #005c4d;
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
          background-color: #005c4d;
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
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.legalassist.com'}/teams" class="button">Manage Team</a>
          </p>
          
          <p>Thank you for growing your team on LegalAssist!</p>
        </div>
        <div class="footer">
          <p>© 2025 Wansom Ltd. All rights reserved.</p>
          <p>Nairobi, Kenya</p>
          <div class="social-links">
            <a href="https://x.com/wansom_ai">Twitter</a> |
            <a href="https://www.linkedin.com/company/wansom-ai">LinkedIn</a>
          </div>
          <p>You're receiving this email because you signed up for Wansom. If you prefer not to receive emails, you can <a href="https://wansom.ai/unsubscribe?email=${user.email}">unsubscribe</a>.</p>
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
          background-color: #005c4d;
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
          background-color: #005c4d;
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
          <p>Nairobi, Kenya</p>
          <div class="social-links">
            <a href="https://x.com/wansom_ai">Twitter</a> |
            <a href="https://www.linkedin.com/company/wansom-ai">LinkedIn</a>
          </div>
          <p>You're receiving this email because you signed up for Wansom. If you prefer not to receive emails, you can <a href="https://wansom.ai/unsubscribe?email=${user.email}">unsubscribe</a>.</p>
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