import { PrismaClient } from '../src/prisma/client/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Finding workspaces with organization visibility...');

  const orgWideProjects = await prisma.project.findMany({
    where: { visibility: 'organization' },
    select: { id: true, title: true }
  });

  console.log(`Found ${orgWideProjects.length} workspace(s) to fix.`);

  if (orgWideProjects.length === 0) {
    console.log('Nothing to fix.');
    return;
  }

  for (const p of orgWideProjects) {
    console.log(` - "${p.title}" (${p.id})`);
  }

  const projectIds = orgWideProjects.map((p) => p.id);

  const [updatedProjects, deletedMembers] = await prisma.$transaction([
    prisma.project.updateMany({
      where: { id: { in: projectIds } },
      data: { visibility: 'restricted' }
    }),
    prisma.projectMember.deleteMany({
      where: {
        projectId: { in: projectIds },
        role: 'member'
      }
    })
  ]);

  console.log(`\nDone.`);
  console.log(`  Workspaces reset to restricted: ${updatedProjects.count}`);
  console.log(`  Auto-added member rows removed: ${deletedMembers.count}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
