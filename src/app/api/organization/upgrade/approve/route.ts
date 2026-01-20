import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AccountType } from "@/lib/constants/roles";

/**
 * GET /api/organization/upgrade/approve?token=xxx
 * Approve an organization upgrade request using the token
 * This endpoint is accessed by clicking the link in the admin email
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Approval token is required' },
      { status: 400 }
    );
  }

  // Find organization with this token
  const organization = await prisma.organization.findFirst({
    where: {
      upgradeRequestToken: token,
      accountType: AccountType.PERSONAL // Must be personal to upgrade
    },
    select: {
      id: true,
      name: true,
      accountType: true,
      upgradeRequestedAt: true,
      ownerId: true
    }
  });

  if (!organization) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://wansom.ai'}/upgrade-error?reason=invalid-token`
    );
  }

  // Check if token is expired (7 days)
  const tokenAge = Date.now() - new Date(organization.upgradeRequestedAt!).getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  if (tokenAge > sevenDays) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://wansom.ai'}/upgrade-error?reason=expired-token`
    );
  }

  // Upgrade the organization
  const updatedOrganization = await prisma.organization.update({
    where: { id: organization.id },
    data: {
      accountType: AccountType.ENTERPRISE,
      upgradeRequestToken: null, // Clear the token
      upgradeRequestedAt: null
    },
    select: {
      id: true,
      name: true,
      accountType: true,
      _count: {
        select: {
          members: true,
          projects: true
        }
      }
    }
  });

  // Redirect to success page with organization details
  const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://wansom.ai'}/upgrade-success?org=${encodeURIComponent(updatedOrganization.name)}`;

  return NextResponse.redirect(successUrl);
}
