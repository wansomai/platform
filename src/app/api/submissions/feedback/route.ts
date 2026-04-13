import { NextRequest, NextResponse } from "next/server";
import { transporter, getNotificationEmails, getNotificationFromEmail } from "@/lib/email/transporter";

const FEEDBACK_PRIMARY_EMAIL = "cruth@wansom.ai";

function getFeedbackRecipients(): string[] {
  const existing = getNotificationEmails();
  const all = [FEEDBACK_PRIMARY_EMAIL, ...existing];
  // deduplicate
  return [...new Set(all)];
}

interface FeedbackPayload {
  email: string;
  reason: string;
  otherReason?: string;
  features: string[];
  suggestion?: string;
  wouldReturn?: string;
}

export async function POST(request: NextRequest) {
  const notificationEmails = getFeedbackRecipients();
  const fromEmail = getNotificationFromEmail();

  if (!fromEmail) {
    console.error("[feedback] Sender email not configured");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  let payload: FeedbackPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, reason, otherReason, features, suggestion, wouldReturn } =
    payload;

  if (!email || !reason) {
    return NextResponse.json(
      { error: "Email and reason are required" },
      { status: 400 }
    );
  }

  const displayReason =
    reason === "Other" && otherReason ? `Other — ${otherReason}` : reason;
  const displayFeatures =
    features && features.length > 0 ? features.join(", ") : "None selected";
  const displayReturn = wouldReturn || "Not answered";
  const displaySuggestion = suggestion?.trim() || "—";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; background: #f3f4f4; margin: 0; padding: 20px; color: #1a1a1a; }
        .card { background: #fff; border-radius: 8px; max-width: 560px; margin: 0 auto; padding: 32px; }
        .header { border-bottom: 2px solid #355e66; padding-bottom: 16px; margin-bottom: 24px; }
        .header h2 { margin: 0; color: #355e66; font-size: 20px; }
        .row { margin-bottom: 20px; }
        .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 4px; }
        .value { font-size: 15px; color: #1a1a1a; }
        .tag { display: inline-block; background: #eef3f4; color: #355e66; border-radius: 20px;
               padding: 3px 10px; font-size: 12px; margin: 2px; }
        .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #eee;
                  font-size: 11px; color: #aaa; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h2>New Feedback Submission</h2>
          <p style="margin:6px 0 0; font-size:13px; color:#555;">
            A user shared why they didn't subscribe to Wansom.
          </p>
        </div>

        <div class="row">
          <div class="label">From</div>
          <div class="value"><a href="mailto:${email}" style="color:#355e66;">${email}</a></div>
        </div>

        <div class="row">
          <div class="label">Reason for not continuing</div>
          <div class="value">${displayReason}</div>
        </div>

        <div class="row">
          <div class="label">Features that interested them</div>
          <div class="value">
            ${
              features && features.length > 0
                ? features.map((f) => `<span class="tag">${f}</span>`).join("")
                : '<span style="color:#aaa;">None selected</span>'
            }
          </div>
        </div>

        <div class="row">
          <div class="label">Would consider returning?</div>
          <div class="value">${displayReturn}</div>
        </div>

        <div class="row">
          <div class="label">What would make Wansom the right fit?</div>
          <div class="value" style="white-space:pre-wrap;">${displaySuggestion}</div>
        </div>

        <div class="footer">Wansom AI — Feedback Form</div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: notificationEmails,
      replyTo: email,
      subject: `Feedback from ${email} — why they didn't subscribe`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[feedback] Failed to send email:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
