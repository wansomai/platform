
import { NextResponse } from "next/server";
import { transporter, getNotificationEmails, getNotificationFromEmail } from '@/lib/email/transporter';
import { NextRequest } from "next/server";

export async function POST(request:NextRequest) {
  if (!request.body) {
    return NextResponse.json({ error: "Request body is empty" }, { status: 400 });
  }

  const notificationEmails = getNotificationEmails();
  if (notificationEmails.length === 0) {
    console.error('No notification emails configured');
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const fromEmail = getNotificationFromEmail();
  if (!fromEmail) {
    console.error('No sender email configured');
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
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
    from: fromEmail,
    to: notificationEmails,
    subject: "New Form Submission",
    text: `You have received a new submission:\n\n${formattedPayload}`,
  };

  try {

  const response=  await transporter.sendMail(mailOptions);
    return NextResponse.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
