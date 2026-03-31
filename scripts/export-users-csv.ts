// scripts/export-users-csv.ts
// Run:npx tsx scripts/export-users-csv.ts

import path from 'node:path';
import fs from 'node:fs';

// Load env files — mirrors Next.js precedence: .env.local overrides .env
function loadEnvFile(filePath: string, override = false) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (override || !process.env[key]) {
      process.env[key] = value;
    }
  }
}

const root = path.resolve(__dirname, '..');
loadEnvFile(path.join(root, '.env'));
loadEnvFile(path.join(root, '.env.local'), true);

import { PrismaClient } from '../src/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      fullName: true,
      organization: {
        select: {
          name: true,
          accountType: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // CSV header matching Snov.io import format
  const header = 'firstName,lastName,fullName,email,company,accountType';
  const rows = users.map((u) => {
    const fullName = u.fullName || '';
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
    const company = u.organization?.name || '';
    const accountType = u.organization?.accountType || 'personal';

    // Escape CSV fields that might contain commas or quotes
    const escape = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    return [firstName, lastName, fullName, u.email, company, accountType]
      .map(escape)
      .join(',');
  });

  const csv = [header, ...rows].join('\n');
  const outPath = path.resolve(__dirname, '..', 'users-export.csv');
  fs.writeFileSync(outPath, csv, 'utf-8');

  console.log(`Exported ${users.length} users to ${outPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
