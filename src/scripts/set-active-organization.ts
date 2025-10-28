/**
 * Data Migration Script: Set Active Organization and Owner ID
 *
 * This script:
 * 1. Sets activeOrganizationId for users who don't have it set
 * 2. Sets ownerId for organizations that don't have it set
 *
 * For existing users created before these features were added,
 * activeOrganizationId defaults to their primary organizationId,
 * and they become the owner of their primary organization.
 *
 * Run with: npx tsx src/scripts/set-active-organization.ts
 */

import { PrismaClient } from '@/prisma/client';

const prisma = new PrismaClient();

interface MigrationStats {
  usersProcessed: number;
  usersUpdated: number;
  usersAlreadySet: number;
  organizationsProcessed: number;
  organizationsUpdated: number;
  organizationsAlreadySet: number;
  errors: string[];
}

async function main() {
  console.log('🚀 Starting activeOrganizationId and ownerId migration...\n');

  const stats: MigrationStats = {
    usersProcessed: 0,
    usersUpdated: 0,
    usersAlreadySet: 0,
    organizationsProcessed: 0,
    organizationsUpdated: 0,
    organizationsAlreadySet: 0,
    errors: [],
  };

  try {
    // Step 1: Get all users
    console.log('📋 Step 1: Fetching all users...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        organizationId: true,
        activeOrganizationId: true,
      },
    });

    console.log(`   Found ${users.length} users\n`);

    // Step 2: Process each user
    console.log('📋 Step 2: Processing users...\n');

    for (const user of users) {
      stats.usersProcessed++;

      try {
        // Skip users who already have activeOrganizationId set
        if (user.activeOrganizationId) {
          stats.usersAlreadySet++;
          console.log(`   ⏭️  Skipping ${user.email} - already has activeOrganizationId set`);
          continue;
        }

        // Set activeOrganizationId to organizationId
        await prisma.user.update({
          where: { id: user.id },
          data: {
            activeOrganizationId: user.organizationId,
          },
        });

        stats.usersUpdated++;
        console.log(`   ✅ Updated ${user.email} - set activeOrganizationId to ${user.organizationId}`);

      } catch (error) {
        const errorMsg = `Failed to process user ${user.email} (${user.id}): ${error}`;
        stats.errors.push(errorMsg);
        console.error(`   ❌ ERROR: ${errorMsg}`);
      }
    }

    // Step 3: Get all organizations and set ownerId
    console.log('\n📋 Step 3: Fetching all organizations...');
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        ownerId: true,
        users: {
          select: {
            id: true,
            email: true,
          },
          take: 1, // Get the first user (primary user for this org)
        },
      },
    });

    console.log(`   Found ${organizations.length} organizations\n`);

    // Step 4: Process each organization
    console.log('📋 Step 4: Processing organizations...\n');

    for (const org of organizations) {
      stats.organizationsProcessed++;

      try {
        // Skip organizations that already have ownerId set
        if (org.ownerId) {
          stats.organizationsAlreadySet++;
          console.log(`   ⏭️  Skipping ${org.name} - already has ownerId set`);
          continue;
        }

        // Find the user whose primary organization this is
        const primaryUser = org.users[0];

        if (!primaryUser) {
          const errorMsg = `Organization ${org.name} (${org.id}) has no primary user!`;
          stats.errors.push(errorMsg);
          console.error(`   ⚠️  WARNING: ${errorMsg}`);
          continue;
        }

        // Set the ownerId to the primary user
        await prisma.organization.update({
          where: { id: org.id },
          data: {
            ownerId: primaryUser.id,
          },
        });

        stats.organizationsUpdated++;
        console.log(`   ✅ Updated ${org.name} - set ownerId to ${primaryUser.email}`);

      } catch (error) {
        const errorMsg = `Failed to process organization ${org.name} (${org.id}): ${error}`;
        stats.errors.push(errorMsg);
        console.error(`   ❌ ERROR: ${errorMsg}`);
      }
    }

    // Step 5: Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`Users processed:             ${stats.usersProcessed}`);
    console.log(`Users updated:               ${stats.usersUpdated}`);
    console.log(`Users already set:           ${stats.usersAlreadySet}`);
    console.log(`Organizations processed:     ${stats.organizationsProcessed}`);
    console.log(`Organizations updated:       ${stats.organizationsUpdated}`);
    console.log(`Organizations already set:   ${stats.organizationsAlreadySet}`);
    console.log(`Errors:                      ${stats.errors.length}`);
    console.log('='.repeat(60));

    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      stats.errors.forEach(error => console.log(`   - ${error}`));
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify data in database');
    console.log('   2. Test organization switching functionality');
    console.log('   3. Confirm profile API returns correct role and ownerId');
    console.log('   4. Verify activeOrganization is never null in API responses\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Rollback function (in case migration needs to be reverted)
async function rollback() {
  console.log('🔄 Rolling back migration...\n');

  try {
    // Set all activeOrganizationId back to null
    const userResult = await prisma.user.updateMany({
      data: {
        activeOrganizationId: null,
      },
    });

    // Set all ownerId back to null
    const orgResult = await prisma.organization.updateMany({
      data: {
        ownerId: null,
      },
    });

    console.log(`✅ Rollback completed successfully!`);
    console.log(`   - Reset ${userResult.count} users`);
    console.log(`   - Reset ${orgResult.count} organizations\n`);
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes('--rollback')) {
  rollback().catch(console.error);
} else {
  main().catch(console.error);
}
