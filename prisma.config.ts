import path from 'node:path';
import fs from 'node:fs';
import { defineConfig } from '@prisma/config';

// Load env files for CLI commands (migrate, studio, etc.)
// Mirrors Next.js precedence: .env.local overrides .env
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
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (override || !process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.resolve(__dirname, '.env'));
loadEnvFile(path.resolve(__dirname, '.env.local'), true); // local overrides base

export default defineConfig({
  datasource: { url: process.env.DATABASE_URL },
});
