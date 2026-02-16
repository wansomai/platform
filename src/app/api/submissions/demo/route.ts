import { NextResponse, NextRequest } from "next/server";
import { transporter } from '@/lib/email/transporter';

export async function POST(request:NextRequest) {
  if (!request.body) {
    return NextResponse.json({ error: "Request body is empty" }, { status: 400 });
  }
  const payload = await request.json();
  // Convert payload object to a formatted string for the email
  const formattedPayload = Object.entries(payload)
    .map(([key, value]) => {
      // Handle nested objects (like `primaryContact`, `trainingProgramSelection`, etc.)
      if (typeof value === "object" && value !== null) {
        return `${key}:\n${Object.entries(value)
          .map(([subKey, subValue]) => `  ${subKey}: ${subValue}`)
          .join("\n")}`;
      }
      return `${key}: ${value}`;
    })
    .join("\n\n");

  const mailOptions = {
    from: "law@wansom.ai",
    to: ["wansomco@gmail.com","law@wansom.ai"],
    subject: "New Demo Form Submission",
    text: `You have received a new submission:\n\n${formattedPayload}`,
  };

  try {
    const response = await transporter.sendMail(mailOptions);

    // Send follow-up email to the user with Calendly link
    const firstName = (payload.name || '').trim().split(/\s+/)[0] || 'there';

    await transporter.sendMail({
      from: '"Wansom AI" <law@wansom.ai>',
      to: payload.email,
      subject: 'Book Your Wansom AI Demo',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.8; color: #333333; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #0a4b5e; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
              <img src="https://wansom.ai/images/logo-dark.png" alt="Wansom" style="max-width: 160px; height: auto;">
            </div>

            <div style="background-color: white; padding: 32px; border-radius: 0 0 8px 8px;">
              <p style="font-size: 15px;">Hi <strong>${firstName}</strong>,</p>

              <p style="font-size: 15px;">Thank you for your interest in Wansom AI.</p>

              <p style="font-size: 15px;">To ensure you get the most out of the platform, I'd love to walk you through a quick demo tailored to your specific needs. You can grab a time slot that works best for you here:</p>

              <p style="text-align: center; margin: 28px 0;">
                <a href="https://calendly.com/wansomco/30min" style="display: inline-block; background-color: #0a4b5e; color: white; padding: 12px 32px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 15px;">Book a Demo</a>
              </p>

              <p style="font-size: 15px;">Looking forward to connecting.</p>

              <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                <p style="font-size: 14px; margin: 0;">Best regards,</p>
                <p style="font-size: 14px; margin: 4px 0 0 0; font-weight: 600;">Legal Solutions Architect,</p>
                <p style="font-size: 14px; margin: 2px 0 0 0;">Wansom AI Limited</p>
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
      `,
    }).catch((err: unknown) => {
      // Log but don't fail the request if the user email fails
      console.error('Failed to send demo follow-up email:', err);
    });

    return NextResponse.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
