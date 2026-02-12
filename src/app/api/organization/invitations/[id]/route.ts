import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import { sendInvitationEmail } from "@/lib/email-service";
import crypto from "crypto";

// Cancel an invitation
export const DELETE = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const invitationId = (await params).id;

  if (!invitationId) {
    return NextResponse.json(
      { error: 'Invitation ID is required' },
      { status: 400 }
    );
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, role: true }
  });

  if (!currentUser?.organizationId) {
    return NextResponse.json(
      { error: 'User organization not found' },
      { status: 404 }
    );
  }

  // Check if current user has permission to cancel invitations
  if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // Find and delete the invitation
  const invitation = await prisma.invitation.findFirst({
    where: {
      id: invitationId,
      organizationId: currentUser.organizationId
    }
  });

  if (!invitation) {
    return NextResponse.json(
      { error: 'Invitation not found' },
      { status: 404 }
    );
  }

  await prisma.invitation.delete({
    where: { id: invitationId }
  });

  return NextResponse.json({ success: true });
}));

/**
 * POST /api/organization/invitations/[id]
 * Resend an invitation (generates new token and extends expiration)
 */
export const POST = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const invitationId = (await params).id;

  if (!invitationId) {
    return NextResponse.json(
      { error: 'Invitation ID is required' },
      { status: 400 }
    );
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, role: true, fullName: true, email: true }
  });

  if (!currentUser?.organizationId) {
    return NextResponse.json(
      { error: 'User organization not found' },
      { status: 404 }
    );
  }

  // Check if current user has permission to resend invitations
  if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // Find the invitation
  const invitation = await prisma.invitation.findFirst({
    where: {
      id: invitationId,
      organizationId: currentUser.organizationId
    },
    include: {
      organization: {
        select: { name: true }
      }
    }
  });

  if (!invitation) {
    return NextResponse.json(
      { error: 'Invitation not found' },
      { status: 404 }
    );
  }

  // Check if invitation has already been accepted
  if (invitation.status === 'accepted') {
    return NextResponse.json(
      { error: 'This invitation has already been accepted' },
      { status: 400 }
    );
  }

  // Generate new token and extend expiration
  const newToken = crypto.randomBytes(32).toString('hex');
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + 7); // Expires in 7 days

  // Update the invitation
  const updatedInvitation = await prisma.invitation.update({
    where: { id: invitationId },
    data: {
      token: newToken,
      expiresAt: newExpiresAt,
      status: 'pending',
      updatedAt: new Date()
    }
  });

  // Resend invitation email
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://wansom.ai';
  const inviteUrl = `${baseUrl}/accept-invitation?token=${newToken}`;

  try {
    await sendInvitationEmail({
      email: invitation.email,
      inviterName: currentUser.fullName || currentUser.email || 'A team member',
      organizationName: invitation.organization.name,
      role: invitation.role,
      inviteUrl
    });
  } catch (emailError) {
    console.error('Failed to resend invitation email:', emailError);
    // Don't fail the request if email fails, but inform the user
    return NextResponse.json({
      success: true,
      warning: 'Invitation updated but email notification failed to send',
      invitation: {
        id: updatedInvitation.id,
        email: updatedInvitation.email,
        role: updatedInvitation.role,
        expiresAt: updatedInvitation.expiresAt.toISOString()
      }
    });
  }

  return NextResponse.json({
    success: true,
    message: 'Invitation resent successfully',
    invitation: {
      id: updatedInvitation.id,
      email: updatedInvitation.email,
      role: updatedInvitation.role,
      expiresAt: updatedInvitation.expiresAt.toISOString()
    }
  });
}));