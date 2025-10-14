// src/lib/event-email-templates.ts
import { sendEmail } from './email-service';

/**
 * Sends event registration confirmation email with opt-in CTA
 */
export async function sendEventRegistrationEmail({
  name,
  email,
  institution,
  optInToken,
}: {
  name: string;
  email: string;
  institution: string;
  optInToken: string;
}) {
  const subject = "You're Registered for the Law School AI Launch Event!";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wansom.ai';
  const optInUrl = `${baseUrl}/api/events/opt-in?token=${optInToken}`;

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
          padding: 30px 20px;
          text-align: center;
        }
        .header img {
          max-width: 200px;
          height: auto;
        }
        .header h1 {
          color: white;
          margin: 15px 0 0 0;
          font-size: 24px;
        }
        .content {
          padding: 30px 20px;
          background-color: #ffffff;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
        }
        .highlight-box {
          background: linear-gradient(135deg, #005c4d 0%, #007a63 100%);
          border-radius: 12px;
          padding: 25px;
          margin: 30px 0;
          color: white;
          text-align: center;
        }
        .highlight-box h2 {
          margin: 0 0 15px 0;
          font-size: 22px;
          color: white;
        }
        .highlight-box p {
          margin: 0 0 20px 0;
          font-size: 16px;
          color: rgba(255, 255, 255, 0.9);
        }
        .cta-button {
          display: inline-block;
          background-color: #f59e0b;
          color: white;
          padding: 15px 35px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          margin-top: 10px;
          transition: background-color 0.3s;
        }
        .cta-button:hover {
          background-color: #d97706;
        }
        .benefits {
          margin: 25px 0;
        }
        .benefit-item {
          display: flex;
          align-items: start;
          margin-bottom: 15px;
        }
        .benefit-icon {
          color: #005c4d;
          font-size: 20px;
          margin-right: 12px;
          font-weight: bold;
        }
        .benefit-text {
          flex: 1;
          color: #333;
        }
        .event-details {
          background-color: #f9fafb;
          border-left: 4px solid #005c4d;
          padding: 20px;
          margin: 25px 0;
          border-radius: 4px;
        }
        .event-details h3 {
          margin: 0 0 15px 0;
          color: #005c4d;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666666;
        }
        .social-links {
          margin-top: 15px;
        }
        .social-links a {
          margin: 0 10px;
          text-decoration: none;
          color: #005c4d;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://wansom.ai/images/logo-dark.png" alt="Wansom Logo">
          <h1>You now have early access to Wansom.AI Student Progam</h1>
        </div>

        <div class="content">
          <p class="greeting">Hi ${name},</p>

          <p>Thank you for registering for <strong>AFRO-IP LAW & TECH 2025 Competitons</strong> As part of your registration, you’ll get exclusive unlimited access to wansom.ai — our AI legal platform for students</p>

          <div class="highlight-box">
            <h2>🎁 Here's what you can do with wansom</h2>
             <div class="benefit-item">
              <span class="benefit-icon">✓</span>
             <div class="benefit-text">
                <strong>Legal Research</strong><br>
                Access to the best legally trained AI models for help you research case law, statutes, and regulations across multiple jurisdictions
              </div>
            </div>
             <div class="benefit-item">
              <span class="benefit-icon">✓</span>
               <div class="benefit-text">
                <strong>Drafting tools</strong><br>
                Draft legal memoranda, contracts, and case briefs with AI assistance
              </div>
            </div>
             <div class="benefit-item">
              <span class="benefit-icon">✓</span>
              <div class="benefit-text">
                <strong>Collaborative workspace</strong><br>
                Collaborate with classmates on research projects,assignments and share resources seamlessly
              </div>
              </div>
            <a href="${optInUrl}" class="cta-button">Activate Wansom Pro Access</a>
          </div>

          <div class="benefits">
          <p>We look forward to seeing you at the event!</p>

          <p>Best regards,<br>
          <strong>The Wansom Team</strong></p>
        </div>

        <div class="footer">
          <p>© 2025 Wansom Ltd. All rights reserved.</p>
          <p>Nairobi, Kenya</p>
          <div class="social-links">
            <a href="https://x.com/wansom_ai">Twitter</a> |
            <a href="https://www.linkedin.com/company/wansom-ai">LinkedIn</a>
          </div>
          <p style="margin-top: 15px;">You're receiving this email because you registered for the Law School AI Launch Event.</p>
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
 * Sends welcome email with login credentials after opt-in
 */
export async function sendWansomProCredentialsEmail({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  const subject = 'Welcome to Wansom Pro - Your Access Details';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wansom.ai';
  const loginUrl = `${baseUrl}/login`;

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
          padding: 30px 20px;
          text-align: center;
        }
        .header img {
          max-width: 200px;
          height: auto;
        }
        .header h1 {
          color: white;
          margin: 15px 0 0 0;
          font-size: 24px;
        }
        .content {
          padding: 30px 20px;
          background-color: #ffffff;
        }
        .success-banner {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin-bottom: 30px;
        }
        .success-banner h2 {
          margin: 0;
          font-size: 22px;
        }
        .credentials-box {
          background-color: #f9fafb;
          border: 2px solid #005c4d;
          border-radius: 8px;
          padding: 25px;
          margin: 25px 0;
        }
        .credentials-box h3 {
          margin: 0 0 20px 0;
          color: #005c4d;
          font-size: 18px;
        }
        .credential-row {
          margin-bottom: 15px;
          padding: 12px;
          background-color: white;
          border-radius: 4px;
          border-left: 4px solid #005c4d;
        }
        .credential-label {
          font-weight: bold;
          color: #666;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block;
          margin-bottom: 5px;
        }
        .credential-value {
          font-size: 16px;
          color: #111;
          font-family: 'Courier New', monospace;
          word-break: break-all;
        }
        .warning-box {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 25px 0;
          border-radius: 4px;
        }
        .warning-box p {
          margin: 0;
          color: #92400e;
        }
        .cta-button {
          display: inline-block;
          background-color: #005c4d;
          color: white;
          padding: 15px 40px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          text-align: center;
          margin: 20px 0;
        }
        .cta-button:hover {
          background-color: #004a3d;
        }
        .steps {
          margin: 25px 0;
        }
        .step {
          display: flex;
          align-items: start;
          margin-bottom: 15px;
        }
        .step-number {
          background-color: #005c4d;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-right: 12px;
          flex-shrink: 0;
        }
        .step-text {
          flex: 1;
          padding-top: 3px;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666666;
        }
        .social-links {
          margin-top: 15px;
        }
        .social-links a {
          margin: 0 10px;
          text-decoration: none;
          color: #005c4d;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://wansom.ai/images/logo-dark.png" alt="Wansom Logo">
          <h1>Welcome to Wansom Pro</h1>
        </div>

        <div class="content">
          <div class="success-banner">
            <h2>🎉 Your Account is Ready!</h2>
          </div>

          <p>Hi ${name},</p>

          <p>Great news! Your Wansom Pro account has been successfully created. You now have unlimited access to our AI-powered legal research and drafting platform.</p>

          <div class="credentials-box">
            <h3>🔐 Your Login Credentials</h3>

            <div class="credential-row">
              <span class="credential-label">Email Address</span>
              <span class="credential-value">${email}</span>
            </div>

            <div class="credential-row">
              <span class="credential-label">Temporary Password</span>
              <span class="credential-value">${password}</span>
            </div>
          </div>

          <div class="warning-box">
            <p><strong>⚠️ Important:</strong> Please change your password after your first login for security purposes. You can do this from your account settings.</p>
          </div>

          <div style="text-align: center;">
            <a href="${loginUrl}" class="cta-button">Login to Wansom Pro</a>
          </div>

          <div class="steps">
            <h3 style="color: #005c4d; margin-bottom: 20px;">Getting Started:</h3>

            <div class="step">
              <div class="step-number">1</div>
              <div class="step-text">
                <strong>Log in</strong> using the credentials above
              </div>
            </div>

            <div class="step">
              <div class="step-number">2</div>
              <div class="step-text">
                <strong>Change your password</strong> from your account settings
              </div>
            </div>

            <div class="step">
              <div class="step-number">3</div>
              <div class="step-text">
                <strong>Explore the platform</strong> and start using AI-powered legal research tools
              </div>
            </div>

            <div class="step">
              <div class="step-number">4</div>
              <div class="step-text">
                <strong>Upload documents</strong> to your secure vault for easy organization and search
              </div>
            </div>
          </div>

          <p style="margin-top: 30px;">Need help getting started? Simply reply to this email or contact us at <a href="mailto:law@wansom.ai" style="color: #005c4d;">law@wansom.ai</a></p>

          <p>We're excited to have you on board!</p>

          <p>Best regards,<br>
          <strong>The Wansom Team</strong></p>
        </div>

        <div class="footer">
          <p>© 2025 Wansom Ltd. All rights reserved.</p>
          <p>Nairobi, Kenya</p>
          <div class="social-links">
            <a href="https://x.com/wansom_ai">Twitter</a> |
            <a href="https://www.linkedin.com/company/wansom-ai">LinkedIn</a>
          </div>
          <p style="margin-top: 15px;">You're receiving this email because you activated your Wansom Pro account.</p>
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
