import { PrismaClient } from '@/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

declare global {
  var prisma: PrismaClient | undefined
  var pgPool: Pool | undefined
}

const connectionString = process.env.DATABASE_URL

// Create a single pg Pool for the application
const pool = global.pgPool || new Pool({ connectionString })
if (process.env.NODE_ENV !== 'production') global.pgPool = pool

const adapter = new PrismaPg(pool)

const prisma = global.prisma || new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export default prisma;