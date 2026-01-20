// app/api/auth/me/route.ts
import { NextRequest } from "next/server";
import { createApiResponse, createErrorResponse } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/middleware";
import { getUserIdFromRequest } from "@/lib/auth/authorization";
import prisma from "@/lib/prisma";
import { AppError } from "@/types/error";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const userId = await getUserIdFromRequest(request);

  if (!userId) {
    return createErrorResponse(
      new AppError("Not authenticated", "AUTH_REQUIRED", 401)
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      organizationId: true,
      activeOrganizationId: true,
      organization: {
        select: {
          id: true,
          name: true,
          accountType: true,
        },
      },
    },
  });

  if (!user) {
    return createErrorResponse(
      new AppError("User not found", "USER_NOT_FOUND", 404)
    );
  }

  return createApiResponse({ user }, "User retrieved successfully");
});