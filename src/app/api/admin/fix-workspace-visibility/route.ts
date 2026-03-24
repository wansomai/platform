import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { withErrorHandler } from '@/lib/api/middleware';

/**
 * POST /api/admin/fix-workspace-visibility
 *
 * One-time data fix: resets every workspace whose visibility was set to
 * 'organization' by the old default (before explicit sharing was introduced)
 * back to 'restricted', and removes the auto-created member-role ProjectMember
 * rows so those users no longer have inherited access.
 *
 * Safe to run multiple times — subsequent runs find 0 matching rows.
 */
export const POST = withErrorHandler(
  withAdminAuth(async (_request: NextRequest) => {
    // 1. Find all projects currently set to 'organization' visibility
    const orgWideProjects = await prisma.project.findMany({
      where: { visibility: 'organization' },
      select: { id: true, title: true }
    });

    if (orgWideProjects.length === 0) {
      return NextResponse.json({
        status: 200,
        message: 'Nothing to fix — no workspaces with organization visibility found.',
        data: { fixed: 0 }
      });
    }

    const projectIds = orgWideProjects.map((p) => p.id);

    // 2. Run atomically: reset visibility + delete auto-added member rows
    await prisma.$transaction([
      // Reset visibility to restricted
      prisma.project.updateMany({
        where: { id: { in: projectIds } },
        data: { visibility: 'restricted' }
      }),
      // Remove the member-role rows that were auto-added when visibility was 'organization'.
      // Admin-role rows (workspace creators) are intentionally preserved.
      prisma.projectMember.deleteMany({
        where: {
          projectId: { in: projectIds },
          role: 'member'
        }
      })
    ]);

    return NextResponse.json({
      status: 200,
      message: `Fixed ${orgWideProjects.length} workspace(s).`,
      data: {
        fixed: orgWideProjects.length,
        workspaces: orgWideProjects.map((p) => ({ id: p.id, title: p.title }))
      }
    });
  })
);
