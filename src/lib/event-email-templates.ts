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
  const subject = "Wansom AI Student Program";
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
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          margin: 0;
          padding: 0;
          background-color: #f8f9fa;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background-color: #0a4b5e;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          color: white;
          margin: 20px 0 0 0;
          font-size: 22px;
          font-weight: 600;
          line-height: 1.4;
        }
        .logo {
          font-size: 32px;
          color: white;
          font-weight: bold;
          letter-spacing: 1px;
        }
        .content {
          padding: 40px 30px;
          background-color: #ffffff;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 20px;
          color: #1f2937;
        }
        .intro-text {
          font-size: 15px;
          line-height: 1.7;
          color: #4b5563;
          margin-bottom: 30px;
        }
        .features-box {
          background-color: #f0f9ff;
          border-radius: 12px;
          padding: 30px;
          margin: 30px 0;
        }
        .features-title {
          font-size: 18px;
          font-weight: 600;
          color: #0a4b5e;
          margin: 0 0 20px 0;
          text-align: center;
        }
        .feature-item {
          display: flex;
          align-items: flex-start;
          margin-bottom: 16px;
          padding: 12px;
          background-color: white;
          border-radius: 8px;
        }
        .feature-item:last-child {
          margin-bottom: 0;
        }
        .feature-icon {
          color: #0a4b5e;
          font-size: 20px;
          margin-right: 12px;
          font-weight: bold;
          flex-shrink: 0;
        }
        .feature-content {
          flex: 1;
        }
        .feature-title {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
          font-size: 15px;
        }
        .feature-desc {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
        }
        .cta-container {
          text-align: center;
          margin: 35px 0;
        }
        .cta-button {
          display: inline-block;
          background-color: #f59e0b;
          color: white;
          padding: 16px 40px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: background-color 0.3s;
          box-shadow: 0 4px 6px rgba(245, 158, 11, 0.2);
        }
        .cta-button:hover {
          background-color: #d97706;
        }
        .closing {
          margin-top: 30px;
          font-size: 15px;
          color: #4b5563;
        }
        .signature {
          margin-top: 20px;
          font-size: 15px;
          color: #1f2937;
        }
        .footer {
          background-color: #f9fafb;
          padding: 30px;
          text-align: center;
          font-size: 13px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }
        .footer-company {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }
        .social-links {
          margin: 15px 0;
        }
        .social-links a {
          margin: 0 8px;
          text-decoration: none;
          color: #0a4b5e;
          font-weight: 500;
        }
        .footer-note {
          margin-top: 15px;
          font-size: 12px;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">WANSOM.AI</div>
          <h1>You now have early access to Wansom.AI Student Program</h1>
        </div>

        <div class="content">
          <p class="greeting">Hi ${name},</p>

          <p class="intro-text">Thank you for registering for <strong>AFRO-IP LAW & TECH 2025 Competitions</strong>. As part of your registration, you'll get exclusive unlimited access to wansom.ai — our AI legal platform for students.</p>

          <div class="features-box">
            <h2 class="features-title">Here's what you can do with Wansom</h2>

            <div class="feature-item">
              <span class="feature-icon">✓</span>
              <div class="feature-content">
                <div class="feature-title">Legal Research</div>
                <p class="feature-desc">Access to the best legally trained AI models to help you research case law, statutes, and regulations across multiple jurisdictions</p>
              </div>
            </div>

            <div class="feature-item">
              <span class="feature-icon">✓</span>
              <div class="feature-content">
                <div class="feature-title">Drafting Tools</div>
                <p class="feature-desc">Draft legal memoranda, contracts, and case briefs with AI assistance</p>
              </div>
            </div>

            <div class="feature-item">
              <span class="feature-icon">✓</span>
              <div class="feature-content">
                <div class="feature-title">Collaborative Workspace</div>
                <p class="feature-desc">Collaborate with classmates on research projects, assignments and share resources seamlessly</p>
              </div>
            </div>
          </div>

          <div class="cta-container">
            <a href="${optInUrl}" class="cta-button">Activate Wansom Pro Access</a>
          </div>

          <p class="closing">We look forward to seeing you at the event!</p>

          <div class="signature">
            Best regards,<br>
            <strong>The Wansom Team</strong>
          </div>
        </div>

        <div class="footer">
          <p class="footer-company">© 2025 Wansom Ltd. All rights reserved.</p>
          <p>Nairobi, Kenya</p>
          <div class="social-links">
            <a href="https://x.com/wansom_ai">Twitter</a> |
            <a href="https://www.linkedin.com/company/wansom-ai">LinkedIn</a>
          </div>
          <p class="footer-note">You're receiving this email because you registered for the AFRO-IP LAW & TECH 2025 Competitions.</p>
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
