import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import { sendInvitationAcceptedEmail } from "@/lib/email-service";

// Accept an organization invitation
export const POST = withErrorHandler(withAuth(async (request: NextRequest, userId: string) => {
  const { token } = await request.json();

  if (!token) {
    return NextResponse.json(
      { error: 'Token is required' },
      { status: 400 }
    );
  }

  // Find the invitation
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      organization: {
        select: {
          id: true,
          name: true
        }
      },
      invitedBy: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    }
  });

  if (!invitation) {
    return NextResponse.json(
      { error: 'Invalid invitation token' },
      { status: 404 }
    );
  }

  // Check if invitation has expired
  if (new Date() > invitation.expiresAt) {
    return NextResponse.json(
      { error: 'This invitation has expired' },
      { status: 400 }
    );
  }

  // Get the current user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true
    }
  });

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  // Verify that the logged-in user's email matches the invitation email
  if (user.email !== invitation.email) {
    return NextResponse.json(
      { error: 'This invitation was sent to a different email address' },
      { status: 403 }
    );
  }

  // Check if user is already a member of this organization
  const existingMembership = await prisma.userOrganization.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: invitation.organizationId
      }
    }
  });

  if (existingMembership) {
    // Delete the invitation since they're already a member
    await prisma.invitation.delete({
      where: { id: invitation.id }
    });

    return NextResponse.json(
      { error: 'You are already a member of this organization' },
      { status: 400 }
    );
  }

  // Create UserOrganization membership
  await prisma.userOrganization.create({
    data: {
      userId: user.id,
      organizationId: invitation.organizationId,
      role: invitation.role
    }
  });

  // Update user's active organization to the new one
  await prisma.user.update({
    where: { id: user.id },
    data: {
      activeOrganizationId: invitation.organizationId
    }
  });

  // Delete the invitation after successful acceptance
  await prisma.invitation.delete({
    where: { id: invitation.id }
  });

  // Send notification email to inviter
  try {
    await sendInvitationAcceptedEmail({
      inviterEmail: invitation.invitedBy.email,
      inviterName: invitation.invitedBy.fullName || invitation.invitedBy.email,
      newMemberName: user.fullName || user.email,
      organizationName: invitation.organization.name,
      role: invitation.role
    });
  } catch (emailError) {
    console.error('Failed to send acceptance notification email:', emailError);
    // Don't fail the acceptance if email fails
  }

  return NextResponse.json({
    success: true,
    message: 'Successfully joined the organization',
    organization: {
      id: invitation.organization.id,
      name: invitation.organization.name
    }
  });
}));
