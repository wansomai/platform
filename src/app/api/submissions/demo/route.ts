import { NextResponse, NextRequest } from "next/server";
import { transporter } from '@/lib/email/transporter';

export async function POST(request: NextRequest) {
  if (!request.body) {
    return NextResponse.json({ error: "Request body is empty" }, { status: 400 });
  }

  const { stage, name, email, accountType, teamSize } = await request.json();

  const details = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Account Type: ${accountType}`,
    teamSize ? `Team Size: ${teamSize}` : null,
  ].filter(Boolean).join('\n');

  try {
    if (stage !== 'inquiry') {
      return NextResponse.json({ error: 'Invalid stage' }, { status: 400 });
    }

    await transporter.sendMail({
      from: 'law@wansom.ai',
      to: ['wansomco@gmail.com', 'law@wansom.ai'],
      subject: `New Demo Request — ${name}`,
      text: `A new demo request has been submitted. The user is now selecting a time slot on Calendly.\n\n${details}`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
