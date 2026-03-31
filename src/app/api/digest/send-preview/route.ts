// src/app/api/digest/send-preview/route.ts
//
// Sends a one-off preview digest email to the given address so the user can
// see exactly what their personalised digest looks like before subscribing.
// No authentication required — the user may not have an account yet.
//
// Uses the agentic pipeline:
//   1. Always run a fresh ingest (RSS + LII scraper + Tavily) for the requested jurisdictions
//   2. Synthesise strictly from DB — no live search fallback
//   3. Send the email

import { NextRequest, NextResponse } from 'next/server';
import { generateLegalDigestFromDB } from '@/services/legalDigestService';
import { ingestJurisdictions } from '@/services/digestIngestService';
import { sendLegalDigestEmail } from '@/lib/email-service';
import { PRACTICE_AREA_LABELS } from '@/types/associates';
import prisma from '@/lib/prisma';

export const maxDuration = 300;

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

// ── DB-based cooldown ─────────────────────────────────────────────────────────
// Stored in DigestCache with a "preview_cooldown::" prefix so the weekly
// digest-cleanup cron automatically removes expired rows — no separate cleanup needed.

async function checkAndSetCooldown(key: string): Promise<{ blocked: boolean; remainingSec: number }> {
  const fingerprint = `preview_cooldown::${key}`;
  const now         = new Date();

  const existing = await prisma.digestCache.findUnique({ where: { fingerprint } });
  if (existing && existing.expiresAt > now) {
    const remainingSec = Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000);
    return { blocked: true, remainingSec };
  }

  // Not blocked — write/refresh the cooldown row
  const expiresAt = new Date(now.getTime() + COOLDOWN_MS);
  await prisma.digestCache.upsert({
    where:  { fingerprint },
    update: { expiresAt, synthesizedAt: now },
    create: {
      fingerprint,
      frequency:     'preview',
      jurisdictions: [],
      topics:        [],
      content:       {},
      expiresAt,
    },
  });

  return { blocked: false, remainingSec: 0 };
}

export async function POST(req: NextRequest) {
  let body: { email?: string; topics?: string[]; jurisdictions?: string[]; frequency?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, topics, jurisdictions, frequency = 'daily' } = body;

  // ── Validate ────────────────────────────────────────────────────────────────
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
  }
  if (!topics || topics.length === 0) {
    return NextResponse.json({ error: 'At least one practice area is required.' }, { status: 400 });
  }
  if (!jurisdictions || jurisdictions.length === 0) {
    return NextResponse.json({ error: 'At least one jurisdiction is required.' }, { status: 400 });
  }

  // ── Cooldown check — one preview per email+jurisdiction combo per 5 minutes ─
  // Keyed on email + sorted jurisdictions so switching jurisdictions is allowed.
  // DB-backed so the gate holds across all serverless instances.
  const cooldownKey = `${email.toLowerCase()}::${[...jurisdictions].sort().join(',')}`;
  const { blocked, remainingSec } = await checkAndSetCooldown(cooldownKey);
  if (blocked) {
    return NextResponse.json(
      { error: `Please wait ${remainingSec}s before requesting another preview for the same jurisdiction.` },
      { status: 429 },
    );
  }

  // ── Convert PracticeArea enum keys to human-readable labels ────────────────
  const topicLabels = topics.map(
    (t) => PRACTICE_AREA_LABELS[t as keyof typeof PRACTICE_AREA_LABELS] || t,
  );

  // Normalise jurisdiction codes to uppercase
  const normJurisdictions = jurisdictions.map((j) => j.toUpperCase());

  try {
    // ── Step 1: Always run a fresh ingest for this preview ───────────────────
    // A preview is a one-off quality request — we always want the latest content
    // rather than relying on however old the last background cron run was.
    // The DB-backed cooldown above (5 min per email+jurisdiction) prevents abuse.
    console.log(`[send-preview] Running fresh ingestion for ${normJurisdictions.join(', ')}`);
    await ingestJurisdictions(normJurisdictions);

    // ── Step 2: Generate digest from DB (falls back to live search if needed) ─
    const { digest, source } = await generateLegalDigestFromDB(
      topicLabels,
      normJurisdictions,
      (frequency === 'weekly' ? 'weekly' : 'daily') as 'daily' | 'weekly',
    );
    console.log(`[send-preview] Digest generated (source=${source}) for ${email}`);

    // ── Step 3: Derive first name from email for the greeting ─────────────────
    const firstName = email.split('@')[0].split(/[._-]/)[0];
    const fullName  = firstName.charAt(0).toUpperCase() + firstName.slice(1);

    // ── Step 4: Send the email ────────────────────────────────────────────────
    const result = await sendLegalDigestEmail({
      email,
      fullName,
      digest,
      frequency,
      isPreview: true,
    });

    if (!result.success) {
      console.error('[send-preview] email send failed:', result.error);
      return NextResponse.json(
        { error: 'Failed to send the preview email. Please try again.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('[send-preview] failed:', err);
    return NextResponse.json(
      { error: err.message || 'Digest generation failed.' },
      { status: 500 },
    );
  }
}
