import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { withErrorHandler } from '@/lib/api/middleware';
import { AccountType } from '@/lib/constants/roles';
import type { ActionResponse } from '@/types/admin';
import { AppError } from '@/types/error';
import { sendGrantAccessEmail } from '@/lib/email-service';

export const maxDuration = 60;

/**
 * POST /api/admin/organizations/[id]/grant-access
 * Manually grant time-limited Pro access for a specific duration (months or days).
 * Intended for customers who paid via bank transfer outside of Paystack.
 * This is NOT a trial — messaging and tracking are kept separate.
 */
export const POST = withErrorHandler(
  withAdminAuth(async (request: NextRequest, userId: string, context: { params: Promise<{ id: string }> }) => {
    const { id: organizationId } = await context.params;

    const body = await request.json();
    const { value, unit } = body as { value: unknown; unit: unknown };

    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 120) {
      throw new AppError('value must be an integer between 1 and 120', 'BAD_REQUEST', 400);
    }
    if (unit !== 'months' && unit !== 'days') {
      throw new AppError("unit must be 'months' or 'days'", 'BAD_REQUEST', 400);
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        owner: { select: { id: true, email: true, fullName: true } },
        subscription: { select: { status: true, planName: true } },
      },
    });

    if (!org) throw new AppError('Organization not found', 'NOT_FOUND', 404);

    const now = new Date();
    const grantedExpiresAt = new Date(now);
    if (unit === 'months') {
      grantedExpiresAt.setMonth(grantedExpiresAt.getMonth() + value);
    } else {
      grantedExpiresAt.setDate(grantedExpiresAt.getDate() + value);
    }

    const grantedDuration = `${value} ${value === 1 ? unit.replace(/s$/, '') : unit}`;
    const expiryDateStr = grantedExpiresAt.toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });

    await prisma.$transaction([
      prisma.organization.update({
        where: { id: organizationId },
        data: {
          accountType: AccountType.ENTERPRISE,
          grantedAt: now,
          grantedExpiresAt,
          grantedExpired: false,
          grantedDuration,
        },
      }),
      prisma.adminLog.create({
        data: {
          organizationId,
          event: 'manual_access_grant',
          details: {
            grantedBy: userId,
            value,
            unit,
            grantedDuration,
            grantedAt: now.toISOString(),
            grantedExpiresAt: grantedExpiresAt.toISOString(),
          },
        },
      }),
      ...(org.owner
        ? [
            prisma.notification.create({
              data: {
                userId: org.owner.id,
                title: `You have been granted ${grantedDuration} of Pro access`,
                message: `You have been granted ${grantedDuration} access to use Wansom. Enjoy your experience. In case of anything, email the support via the support icon. Your access expires on ${expiryDateStr}.`,
                type: 'info',
              },
            }),
          ]
        : []),
    ]);

    if (org.owner) {
      try {
        await sendGrantAccessEmail(org.owner, org.name, grantedDuration, grantedExpiresAt);
      } catch (emailErr) {
        console.error(`[grant-access] Failed to send email for org ${organizationId}:`, emailErr);
      }
    }

    const response: ActionResponse = {
      success: true,
      message: `${org.name} has been granted ${grantedDuration} of Pro access. Expires on ${expiryDateStr}.`,
    };

    return NextResponse.json(response);
  })
);
