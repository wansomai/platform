import path from 'node:path';
import { defineConfig } from '@prisma/config';
import { config } from 'dotenv';

// Load environment variables from .env.local (takes precedence) and .env
config({ path: path.resolve(__dirname, '.env.local') });
config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  datasource: { url: process.env.DATABASE_URL },
});