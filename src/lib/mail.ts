// src/lib/email-service.ts
import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  // Get email credentials from environment variables
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
  
  try {
    // Send email
    const info = await transporter.sendMail({
      from: from || `"Tabitha" <${user}>`,
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

// Specific email templates
export function sendWelcomeEmail(user: { email: string; fullName: string; }) {
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
          <h1>Welcome to Wansom, ${user.fullName}!</h1>
          
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