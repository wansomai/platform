import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse, NextRequest } from 'next/server';
import { upsertLandingPage } from './upsertLandingPage';

// POST /api/generate?phase=phase1_africa_en
export async function POST(req: NextRequest) {
  // ----- read query param (defaults to first file) -----
  const { searchParams } = new URL(req.url);
  const phase = searchParams.get('phase') || 'phase1_africa_en';

  // ----- load JSON -----
  const filePath = path.join(process.cwd(), 'data', 'geo', `${phase}.json`);
  let records: any[];
  try {
    records = JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (e) {
    return NextResponse.json(
      { error: `Cannot read ${filePath}` },
      { status: 400 }
    );
  }

  // ----- loop & upsert -----
  const report: Array<{ slug: string; status: string; error?: string }> = [];
  for (const r of records) {
    const slug = `${r.practiceArea}-lawyer-${r.location}`;
    try {
      await upsertLandingPage(r);
      report.push({ slug, status: 'ok' });
      // tiny throttle to avoid CMA rate‑limits
      await new Promise((res) => setTimeout(res, 200));
    } catch (err: any) {
      report.push({ slug, status: 'error', error: err.message });
    }
  }

  return NextResponse.json({
    phase,
    processed: report.length,
    report,
  });
}
