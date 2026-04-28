import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { withErrorHandler } from '@/lib/api/middleware';
import { AccountType } from '@/lib/constants/roles';
import type { OrganizationDetailsResponse, AdminOrganizationDetails, UpgradeStatus } from '@/types/admin';
import { AppError } from '@/types/error';

/**
 * GET /api/admin/organizations/[id]
 * Get detailed information about a single organization
 */
export const GET = withErrorHandler(
  withAdminAuth(async (request: NextRequest, userId: string, context: { params: Promise<{ id: string }> }) => {
    const { id: organizationId } = await context.params;

    // Fetch organization with all related data
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            fullName: true,
            createdAt: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
          orderBy: { joinedAt: 'desc' },
        },
        subscription: {
          select: {
            id: true,
            planName: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            billingCycle: true,
          },
        },
        projects: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Limit to 10 most recent projects
        },
      },
    });

    if (!organization) {
      throw new AppError('Organization not found', 'NOT_FOUND', 404);
    }

    // Determine upgrade status
    let upgradeStatus: UpgradeStatus = 'none';
    if (organization.upgradeRequestToken) {
      upgradeStatus = 'pending';
    } else if (organization.accountType === AccountType.ENTERPRISE) {
      upgradeStatus = 'approved';
    }

    // Transform the data
    const orgDetails: AdminOrganizationDetails = {
      id: organization.id,
      name: organization.name,
      accountType: organization.accountType as 'personal' | 'enterprise',
      upgradeStatus,
      upgradeRequestToken: organization.upgradeRequestToken,
      upgradeRequestedAt: organization.upgradeRequestedAt?.toISOString() || null,
      contactEmail: organization.contactEmail,
      contactPhone: organization.contactPhone,
      owner: organization.owner,
      memberCount: organization.members.length,
      projectCount: organization.projects.length,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
      members: organization.members.map((member) => ({
        user: member.user,
        role: member.role,
        joinedAt: member.joinedAt.toISOString(),
      })),
      subscription: organization.subscription
        ? {
            id: organization.subscription.id,
            planName: organization.subscription.planName,
            status: organization.subscription.status,
            currentPeriodStart: organization.subscription.currentPeriodStart?.toISOString() || null,
            currentPeriodEnd: organization.subscription.currentPeriodEnd?.toISOString() || null,
            billingCycle: organization.subscription.billingCycle,
          }
        : null,
      projects: organization.projects.map((project) => ({
        id: project.id,
        title: project.title,
        status: project.status,
        createdAt: project.createdAt.toISOString(),
      })),
      onboardingCompleted: organization.onboardingCompleted,
      profileStatus: organization.profileStatus,
      practiceAreas: organization.practiceAreas,
      firmSize: organization.firmSize,
      currentWebsite: organization.currentWebsite,
      linkedinUrl: organization.linkedinUrl,
      grantedAt: organization.grantedAt?.toISOString() ?? null,
      grantedExpiresAt: organization.grantedExpiresAt?.toISOString() ?? null,
      grantedExpired: organization.grantedExpired,
      grantedDuration: organization.grantedDuration ?? null,
    };

    const response: OrganizationDetailsResponse = {
      organization: orgDetails,
    };

    return NextResponse.json(response);
  })
);
