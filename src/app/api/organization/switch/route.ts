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

    // Get all organizations user is a member of
    const memberships = await prisma.userOrganization.findMany({
      where: { userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            accountType: true,
          }
        }
      }
    });

    // Combine primary organization with member organizations
    const organizations = [
      {
        id: user.organization.id,
        name: user.organization.name,
        accountType: user.organization.accountType,
        isPrimary: true,
        role: 'owner', // Primary org owner
      },
      ...memberships.map((m:any) => ({
        id: m.organization.id,
        name: m.organization.name,
        accountType: m.organization.accountType,
        isPrimary: false,
        role: m.role,
      }))
    ];

    // Remove duplicates (in case primary org is also in memberships)
    const uniqueOrgs = organizations.filter((org, index, self) =>
      index === self.findIndex(o => o.id === org.id)
    );

    return NextResponse.json({
      currentOrganizationId: user.activeOrganizationId || user.organizationId,
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
