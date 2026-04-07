import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import { sendInvitationAcceptedEmail, sendSeatBilledEmail } from "@/lib/email-service";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/** Returns the number of days in one billing cycle based on the plan's interval */
function daysInBillingCycle(billingCycle: string | null): number {
  switch (billingCycle) {
    case 'daily':      return 1;
    case 'weekly':     return 7;
    case 'monthly':    return 30;
    case 'quarterly':  return 90;
    case 'biannually': return 180;
    case 'annually':   return 365;
    default:           return 30;
  }
}

// Accept an organization invitation
export const POST = withErrorHandler(withAuth(async (request: NextRequest, userId: string) => {
  const { token } = await request.json();

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  // Find the invitation with everything needed upfront
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      organization: {
        select: { id: true, name: true, ownerId: true },
      },
      invitedBy: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 });
  }

  if (new Date() > invitation.expiresAt) {
    return NextResponse.json({ error: 'This invitation has expired' }, { status: 400 });
  }

  // Get the accepting user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (user.email !== invitation.email) {
    return NextResponse.json(
      { error: 'This invitation was sent to a different email address' },
      { status: 403 }
    );
  }

  // Check for existing membership
  const existingMembership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: invitation.organizationId } },
  });

  if (existingMembership) {
    await prisma.invitation.delete({ where: { id: invitation.id } });
    return NextResponse.json({ error: 'You are already a member of this organization' }, { status: 400 });
  }

  // Create membership and update active org atomically
  await prisma.$transaction([
    prisma.userOrganization.create({
      data: { userId: user.id, organizationId: invitation.organizationId, role: invitation.role },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { activeOrganizationId: invitation.organizationId },
    }),
    prisma.invitation.delete({ where: { id: invitation.id } }),
  ]);

  // Send accepted notification to inviter (non-blocking)
  sendInvitationAcceptedEmail({
    inviterEmail: invitation.invitedBy.email,
    inviterName: invitation.invitedBy.fullName || invitation.invitedBy.email,
    newMemberName: user.fullName || user.email,
    organizationName: invitation.organization.name,
    role: invitation.role,
  }).catch((err) => console.error('Failed to send acceptance email:', err));

  // In-app notification for the inviter
  prisma.notification.create({
    data: {
      userId: invitation.invitedBy.id,
      title: 'Invitation accepted',
      message: `${user.fullName || user.email} has joined ${invitation.organization.name} as ${invitation.role}.`,
      type: 'success',
    },
  }).catch((err) => console.error('Failed to create invitation accepted notification:', err));

  // Seat billing for Teams plan organizations (completely non-blocking)
  billedSeatCharge({
    organizationId: invitation.organizationId,
    ownerId: invitation.organization.ownerId,
    organizationName: invitation.organization.name,
    newMemberEmail: user.email,
  }).catch((err) => console.error('Seat billing error (non-blocking):', err));

  return NextResponse.json({
    success: true,
    message: 'Successfully joined the organization',
    organization: { id: invitation.organization.id, name: invitation.organization.name },
  });
}));

/**
 * Attempts a prorated seat charge when a member joins a Teams-plan org.
 * This is fire-and-forget — failures are logged but never surface to the user.
 */
async function billedSeatCharge({
  organizationId,
  ownerId,
  organizationName,
  newMemberEmail,
}: {
  organizationId: string;
  ownerId: string | null;
  organizationName: string;
  newMemberEmail: string;
}) {
  if (!PAYSTACK_SECRET_KEY || !ownerId) return;

  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    select: {
      id: true,
      planType: true,
      paystackAuthCode: true,
      currentPeriodEnd: true,
      billingCycle: true,
      planPrice: true,
      seatCount: true,
    },
  });

  if (
    !subscription ||
    subscription.planType !== 'teams' ||
    !subscription.paystackAuthCode ||
    !subscription.currentPeriodEnd
  ) {
    return;
  }

  const now = new Date();
  const periodEnd = subscription.currentPeriodEnd;
  const daysRemaining = Math.max(
    0,
    Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );
  const cycleLength = daysInBillingCycle(subscription.billingCycle);

  // Derive per-seat price in cents from stored planPrice (stored as dollars e.g. "15")
  const seatPriceCents = Math.round(parseFloat(subscription.planPrice || '15') * 100);
  const proratedAmount = Math.ceil((daysRemaining / cycleLength) * seatPriceCents);

  // Don't charge less than $0.50 — Paystack minimum
  if (proratedAmount < 50) return;

  const orgOwner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { email: true, fullName: true },
  });

  if (!orgOwner?.email) return;

  const chargeRef = `WAN-SEAT-${organizationId.slice(0, 8)}-${Date.now()}`;

  const chargeResponse = await fetch(`${PAYSTACK_BASE_URL}/transaction/charge_authorization`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      authorization_code: subscription.paystackAuthCode,
      email: orgOwner.email,
      amount: proratedAmount,
      reference: chargeRef,
      metadata: {
        type: 'seat_addition',
        newMemberEmail,
        organizationId,
      },
    }),
  });

  const chargeData = await chargeResponse.json();

  if (!(chargeData.status && chargeData.data?.status === 'success')) {
    console.error('Seat charge failed:', chargeData.message || chargeData);
    return;
  }

  // Record the charge and increment seat count in one transaction
  const newSeatCount = (subscription.seatCount ?? 1) + 1;

  await prisma.$transaction([
    prisma.subscription.update({
      where: { organizationId },
      data: { seatCount: { increment: 1 } },
    }),
    prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        paystackReference: chargeRef,
        amount: proratedAmount,
        currency: chargeData.data.currency || 'USD',
        status: 'success',
        paymentMethod: chargeData.data.channel || 'card',
        paidAt: new Date(),
        metadata: {
          type: 'seat_addition',
          newMemberEmail,
          organizationId,
        },
      },
    }),
  ]);

  // Notify the org owner
  await sendSeatBilledEmail({
    ownerEmail: orgOwner.email,
    ownerName: orgOwner.fullName || orgOwner.email,
    newMemberEmail,
    amount: `$${(proratedAmount / 100).toFixed(2)}`,
    organizationName,
    newSeatCount,
    nextBillingDate: periodEnd.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  });
}
