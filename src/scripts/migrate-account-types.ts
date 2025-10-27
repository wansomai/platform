/**
 * Data Migration Script: Account Types and Ownership
 *
 * This script migrates existing organizations to the new account type system:
 * - Adds accountType field (personal vs enterprise)
 * - Sets ownerId for all organizations
 * - Updates workspace visibility settings
 * - Converts first admin/member to owner role
 *
 * Run with: npx tsx src/scripts/migrate-account-types.ts
 */

import { PrismaClient } from '@/prisma/client';
import { OrganizationRole, AccountType, WorkspaceVisibility } from '@/lib/constants/roles';

const prisma = new PrismaClient();

interface MigrationStats {
  organizationsProcessed: number;
  organizationsUpdated: number;
  ownersAssigned: number;
  rolesUpdated: number;
  errors: string[];
}

async function main() {
  console.log('🚀 Starting account types and ownership migration...\n');

  const stats: MigrationStats = {
    organizationsProcessed: 0,
    organizationsUpdated: 0,
    ownersAssigned: 0,
    rolesUpdated: 0,
    errors: [],
  };

  try {
    // Step 1: Sync schema changes to database
    console.log('📋 Step 1: Ensuring schema is up to date...');
    console.log('   Run: npx prisma db push (if not already done)\n');

    // Step 2: Get all organizations
    console.log('📋 Step 2: Fetching all organizations...');
    const organizations = await prisma.organization.findMany({
      include: {
        members: {
          orderBy: {
            joinedAt: 'asc', // First member to join becomes owner
          },
          include: {
            user: true,
          },
        },
      },
    });

    console.log(`   Found ${organizations.length} organizations\n`);

    // Step 3: Process each organization
    console.log('📋 Step 3: Processing organizations...\n');

    for (const org of organizations) {
      stats.organizationsProcessed++;

      try {
        console.log(`   Processing: ${org.name} (${org.id})`);

        // Determine account type based on member count
        // Organizations with more than 1 member are likely enterprise accounts
        // Single-member orgs created during registration are personal accounts
        const memberCount = org.members.length;
        const accountType = memberCount > 1 ? AccountType.ENTERPRISE : AccountType.PERSONAL;

        // Find the owner (first member to join, or first admin/owner role)
        let ownerMember = org.members.find(m =>
          m.role === 'owner' || m.role === 'admin'
        );

        // If no admin/owner found, use first member
        if (!ownerMember && org.members.length > 0) {
          ownerMember = org.members[0];
        }

        if (!ownerMember) {
          stats.errors.push(`Organization ${org.name} (${org.id}) has no members!`);
          console.log(`   ⚠️  WARNING: No members found, skipping`);
          continue;
        }

        // Update organization with accountType and ownerId
        await prisma.organization.update({
          where: { id: org.id },
          data: {
            accountType,
            ownerId: ownerMember.userId,
          },
        });

        stats.organizationsUpdated++;
        stats.ownersAssigned++;

        console.log(`   ✅ Set accountType: ${accountType}`);
        console.log(`   ✅ Set owner: ${ownerMember.user.email}`);

        // Step 4: Update owner's role to 'owner' if not already
        if (ownerMember.role !== OrganizationRole.OWNER) {
          await prisma.userOrganization.update({
            where: {
              userId_organizationId: {
                userId: ownerMember.userId,
                organizationId: org.id,
              },
            },
            data: {
              role: OrganizationRole.OWNER,
            },
          });

          stats.rolesUpdated++;
          console.log(`   ✅ Updated role from '${ownerMember.role}' to 'owner'`);
        }

        console.log('');
      } catch (error) {
        const errorMsg = `Failed to process organization ${org.name} (${org.id}): ${error}`;
        stats.errors.push(errorMsg);
        console.error(`   ❌ ERROR: ${errorMsg}\n`);
      }
    }

    // Step 5: Update workspace visibility (set default to 'organization')
    // Note: visibility field already has a default value in schema, so this step
    // is only needed if there are old records without the field set
    console.log('📋 Step 4: Ensuring workspace visibility is set...');

    // Since visibility is not nullable in the schema and has a default,
    // we'll skip this step as it's not needed
    console.log(`   ✅ Skipped - visibility field already has default value in schema\n`);

    // Step 6: Print summary
    console.log('=' .repeat(60));
    console.log('📊 Migration Summary');
    console.log('=' .repeat(60));
    console.log(`Organizations processed:  ${stats.organizationsProcessed}`);
    console.log(`Organizations updated:    ${stats.organizationsUpdated}`);
    console.log(`Owners assigned:          ${stats.ownersAssigned}`);
    console.log(`Roles updated:            ${stats.rolesUpdated}`);
    console.log(`Errors:                   ${stats.errors.length}`);
    console.log('=' .repeat(60));

    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      stats.errors.forEach(error => console.log(`   - ${error}`));
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify data in database');
    console.log('   2. Update API endpoints to use new authorization utilities');
    console.log('   3. Test role hierarchy and permissions');
    console.log('   4. Implement upgrade flow for personal accounts\n');

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
    // Reset accountType to default
    await prisma.organization.updateMany({
      data: {
        accountType: AccountType.PERSONAL,
        ownerId: null,
      },
    });

    // Reset workspace visibility
    await prisma.project.updateMany({
      data: {
        visibility: WorkspaceVisibility.ORGANIZATION,
      },
    });

    console.log('✅ Rollback completed successfully!\n');
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
