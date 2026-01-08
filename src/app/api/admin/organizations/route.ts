import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/prisma/client';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { withErrorHandler } from '@/lib/api/middleware';
import { AccountType } from '@/lib/constants/roles';
import type { OrganizationsResponse, AdminOrganization, UpgradeStatus, FilterType } from '@/types/admin';

const prisma = new PrismaClient();

/**
 * GET /api/admin/organizations
 * List all organizations with filtering and pagination
 * Query params:
 * - filter: 'all' | 'pending' | 'upgraded'
 * - search: string (search by org name or owner email)
 * - page: number (default 1)
 * - limit: number (default 20)
 */
export const GET = withErrorHandler(
  withAdminAuth(async (request: NextRequest) => {
    const searchParams = request.nextUrl.searchParams;
    const filter = (searchParams.get('filter') || 'all') as FilterType;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 per page

    // Build where clause based on filter
    const where: any = {};

    if (filter === 'pending') {
      where.upgradeRequestToken = { not: null };
    } else if (filter === 'upgraded') {
      where.accountType = AccountType.ENTERPRISE;
    }

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
        { owner: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Fetch organizations with pagination
    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        select: {
          id: true,
          name: true,
          accountType: true,
          upgradeRequestToken: true,
          upgradeRequestedAt: true,
          contactEmail: true,
          contactPhone: true,
          createdAt: true,
          updatedAt: true,
          owner: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
          _count: {
            select: {
              members: true,
              projects: true,
            },
          },
        },
        orderBy: [
          { upgradeRequestedAt: { sort: 'desc', nulls: 'last' } }, // Pending requests first
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.organization.count({ where }),
    ]);

    // Get stats
    const [totalOrgs, pendingUpgrades, enterpriseAccounts, personalAccounts] =
      await Promise.all([
        prisma.organization.count(),
        prisma.organization.count({
          where: { upgradeRequestToken: { not: null } },
        }),
        prisma.organization.count({
          where: { accountType: AccountType.ENTERPRISE },
        }),
        prisma.organization.count({
          where: { accountType: AccountType.PERSONAL },
        }),
      ]);

    // Transform data and add upgrade status
    const orgsWithStatus: AdminOrganization[] = organizations.map((org) => {
      let upgradeStatus: UpgradeStatus = 'none';
      if (org.upgradeRequestToken) {
        upgradeStatus = 'pending';
      } else if (org.accountType === AccountType.ENTERPRISE) {
        upgradeStatus = 'approved';
      }

      return {
        id: org.id,
        name: org.name,
        accountType: org.accountType as 'personal' | 'enterprise',
        upgradeStatus,
        upgradeRequestToken: org.upgradeRequestToken,
        upgradeRequestedAt: org.upgradeRequestedAt?.toISOString() || null,
        contactEmail: org.contactEmail,
        contactPhone: org.contactPhone,
        owner: org.owner,
        memberCount: org._count.members,
        projectCount: org._count.projects,
        createdAt: org.createdAt.toISOString(),
        updatedAt: org.updatedAt.toISOString(),
      };
    });

    const response: OrganizationsResponse = {
      organizations: orgsWithStatus,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalOrgs,
        pendingUpgrades,
        enterpriseAccounts,
        personalAccounts,
      },
    };

    return NextResponse.json(response);
  })
);
