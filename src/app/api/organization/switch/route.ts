import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth/auth-options';
import prisma from '@/lib/prisma';

// GET /api/organization/switch - Get list of organizations user can switch to
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user's current organization info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        organizationId: true,
        activeOrganizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
            accountType: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Use a mutable copy so self-heal can update organizationId in-memory
    let primaryOrgId: string | null = user.organizationId;

    // Self-heal: user has no organizationId at all — create one or adopt from memberships
    if (!primaryOrgId) {
      const anyMembership = await prisma.userOrganization.findFirst({
        where: { userId },
        include: { organization: true },
      });

      if (anyMembership) {
        // Adopt the first available membership org as their primary
        await prisma.user.update({
          where: { id: userId },
          data: { organizationId: anyMembership.organizationId },
        });
        primaryOrgId = anyMembership.organizationId;
      } else {
        // No org anywhere — create a personal one from scratch
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { fullName: true },
        });
        const org = await prisma.organization.create({
          data: {
            name: `${dbUser?.fullName || 'My'} Organization`,
            accountType: 'personal',
            ownerId: userId,
            practiceAreas: [],
            serviceAreas: [],
          },
        });
        await prisma.user.update({
          where: { id: userId },
          data: { organizationId: org.id },
        });
        await prisma.userOrganization.create({
          data: { userId, organizationId: org.id, role: 'owner' },
        });
        primaryOrgId = org.id;
      }
    }

    // Self-heal: has organizationId but no UserOrganization row — create it
    if (primaryOrgId) {
      const hasMembership = await prisma.userOrganization.findUnique({
        where: { userId_organizationId: { userId, organizationId: primaryOrgId } },
      });
      if (!hasMembership) {
        await prisma.userOrganization.create({
          data: { userId, organizationId: primaryOrgId, role: 'owner' },
        });
        await prisma.organization.updateMany({
          where: { id: primaryOrgId, ownerId: null },
          data: { ownerId: userId },
        });
      }
    }

    // Get all organizations user is a member of (now includes self-healed primary)
    const memberships = await prisma.userOrganization.findMany({
      where: { userId },
      include: {
        organization: {
          select: { id: true, name: true, accountType: true, ownerId: true }
        }
      }
    });

    // Build org list from UserOrganization — the source of truth
    const orgsFromMemberships = memberships.map((m: any) => ({
      id: m.organization.id,
      name: m.organization.name,
      accountType: m.organization.accountType,
      isPrimary: m.organizationId === primaryOrgId,
      role: m.role,
    }));

    // If user has a primary org not in memberships at all, add it as fallback
    const primaryCovered = orgsFromMemberships.some((o) => o.id === primaryOrgId);
    if (!primaryCovered && user.organization) {
      orgsFromMemberships.unshift({
        id: user.organization.id,
        name: user.organization.name,
        accountType: user.organization.accountType,
        isPrimary: true,
        role: 'owner',
      });
    }

    // Remove duplicates
    const uniqueOrgs = orgsFromMemberships.filter((org, index, self) =>
      index === self.findIndex((o) => o.id === org.id)
    );

    return NextResponse.json({
      currentOrganizationId: user.activeOrganizationId || primaryOrgId,
      organizations: uniqueOrgs
    });

  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

// POST /api/organization/switch - Switch to a different organization
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { organizationId } = await request.json();


    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        organizationId: true,
        activeOrganizationId: true,
        organizationMemberships: {
          where: { organizationId },
          select: { organizationId: true, role: true }
        }
      }
    });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has access (either primary org or member of org)
    const hasAccess =
      user.organizationId === organizationId ||
      user.organizationMemberships.length > 0;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this organization' },
        { status: 403 }
      );
    }

    // Get organization details
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        accountType: true,
      }
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Update user's active organization
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { activeOrganizationId: organizationId },
      select: {
        id: true,
        activeOrganizationId: true,
        organizationId: true
      }
    });


    return NextResponse.json({
      success: true,
      organization,
      message: `Switched to ${organization.name}`
    });

  } catch (error) {
    console.error('Error switching organization:', error);
    return NextResponse.json(
      { error: 'Failed to switch organization' },
      { status: 500 }
    );
  }
}
