import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import prisma from '@/lib/prisma';

export const maxDuration = 60;

// Common free/consumer email domains — anything NOT in this set is treated as professional.
const FREE_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.uk', 'yahoo.co.in', 'yahoo.fr', 'yahoo.de',
  'yahoo.es', 'yahoo.it', 'yahoo.ca', 'yahoo.com.au', 'yahoo.com.br',
  'yahoo.com.mx', 'yahoo.co.jp', 'yahoo.in', 'yahoo.co.nz', 'yahoo.co.za',
  'hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.de',
  'hotmail.es', 'hotmail.it', 'hotmail.ca', 'hotmail.com.br',
  'outlook.com', 'outlook.co.uk', 'outlook.fr', 'outlook.de',
  'outlook.es', 'outlook.it', 'outlook.ca', 'outlook.com.br', 'outlook.in',
  'live.com', 'live.co.uk', 'live.fr', 'live.de', 'live.es',
  'live.it', 'live.ca', 'live.com.br', 'live.in',
  'icloud.com', 'me.com', 'mac.com',
  'msn.com',
  'aol.com',
  'protonmail.com', 'protonmail.ch', 'pm.me',
  'tutanota.com', 'tutamail.com', 'tuta.io',
  'mail.com',
  'gmx.com', 'gmx.net', 'gmx.de',
  'yandex.com', 'yandex.ru',
  'qq.com', '163.com', '126.com', 'yeah.net', 'sina.com',
  'rediffmail.com',
  'web.de',
  'inbox.com',
  'fastmail.com', 'fastmail.fm',
]);

function isProfessional(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return !!domain && !FREE_DOMAINS.has(domain);
}

function escapeCsv(value: string | null | undefined): string {
  const s = value ?? '';
  // Wrap in quotes if the value contains a comma, quote, or newline
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function handler(request: NextRequest, _userId: string) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'professional' | 'personal'

  if (type !== 'professional' && type !== 'personal') {
    return NextResponse.json(
      { error: 'type must be "professional" or "personal"' },
      { status: 400 }
    );
  }

  const users = await prisma.user.findMany({
    select: {
      fullName: true,
      email: true,
      createdAt: true,
      organization: { select: { name: true, accountType: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const filtered = users.filter((u) =>
    type === 'professional' ? isProfessional(u.email) : !isProfessional(u.email)
  );

  const header = 'Name,Email,Organization,Account Type,Joined\n';
  const rows = filtered.map((u) =>
    [
      escapeCsv(u.fullName),
      escapeCsv(u.email),
      escapeCsv(u.organization?.name),
      escapeCsv(u.organization?.accountType),
      escapeCsv(u.createdAt.toISOString().split('T')[0]),
    ].join(',')
  );

  const csv = header + rows.join('\n');
  const filename = `wansom-users-${type}-emails-${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export const GET = withAdminAuth(handler);
