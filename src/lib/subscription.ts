// src/lib/subscription.ts
import prisma from '@/lib/prisma';

export interface SubscriptionLimits {
  maxProjects: number;
  maxMessages: number;
  hasProAccess: boolean;
}

export interface UserPlanInfo {
  planName: string;
  status: string;
  limits: SubscriptionLimits;
  currentUsage: {
    projectCount: number;
    messageCount: number;
  };
}

// Default limits for free plan
const FREE_PLAN_LIMITS: SubscriptionLimits = {
  maxProjects: 2,
  maxMessages: 8,
  hasProAccess: false,
};

// Pro plan limits
const PRO_PLAN_LIMITS: SubscriptionLimits = {
  maxProjects: -1, // unlimited
  maxMessages: -1, // unlimited
  hasProAccess: true,
};

// Explorer plan — full Pro access for 14 days (same limits as Pro)
const EXPLORER_PLAN_LIMITS: SubscriptionLimits = {
  maxProjects: -1,
  maxMessages: -1,
  hasProAccess: true,
};

/**
 * Get user plan information and current usage
 */
export async function getUserPlanInfo(organizationId: string): Promise<UserPlanInfo> {
  try {
    // Get both subscription information AND organization accountType
    const [subscription, organization] = await Promise.all([
      prisma.subscription.findUnique({
        where: { organizationId },
      }),
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { accountType: true, trialExpired: true, trialExpiresAt: true }
      })
    ]);

    // Determine plan from subscription + org type before counting usage
    const normalizedPlanName = subscription?.planName?.trim().toLowerCase() ?? null;
    const normalizedStatus = subscription?.status?.trim().toLowerCase() ?? null;
    const hasActiveSubscription =
      !!subscription &&
      ['active', 'non_renewing'].includes(normalizedStatus ?? '') &&
      normalizedPlanName !== 'explorer';

    const isEnterpriseAccount = organization?.accountType === 'enterprise';

    // Check for active manual trial (15-day Pro access window)
    const now = new Date();
    const hasActiveTrial =
      !organization?.trialExpired &&
      organization?.trialExpiresAt != null &&
      organization.trialExpiresAt > now;

    // Explorer plan: one-time 14-day access, identified by planName and a valid currentPeriodEnd
    const isExplorerPlan =
      normalizedPlanName === 'explorer' &&
      normalizedStatus === 'active' &&
      subscription?.currentPeriodEnd != null &&
      subscription.currentPeriodEnd > now;

    const isProPlan = hasActiveSubscription || isEnterpriseAccount || hasActiveTrial;

    const planName = isEnterpriseAccount ? 'enterprise' : hasActiveTrial ? 'trial_pro' : (subscription?.planName || 'free');
    const status = isEnterpriseAccount ? 'active' : hasActiveTrial ? 'trial' : (subscription?.status || 'free');

    // Explorer plan takes priority over free but not over pro/trial
    if (isExplorerPlan && !isProPlan) {
      return {
        planName: 'explorer',
        status: 'explorer',
        limits: EXPLORER_PLAN_LIMITS,
        currentUsage: { projectCount: 0, messageCount: 0 },
      };
    }

    // Pro/Enterprise plans are unlimited — skip the count queries entirely
    if (isProPlan) {
      return {
        planName,
        status,
        limits: PRO_PLAN_LIMITS,
        currentUsage: { projectCount: 0, messageCount: 0 },
      };
    }

    // Free plan — count usage to enforce limits
    const [projectCount, messageCount] = await Promise.all([
      prisma.project.count({ where: { organizationId } }),
      prisma.message.count({
        where: {
          conversation: { project: { organizationId } },
          role: 'user',
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      planName,
      status,
      limits: FREE_PLAN_LIMITS,
      currentUsage: { projectCount, messageCount },
    };
  } catch (error) {
    console.error('Error fetching user plan info:', error);
    // Return free plan as fallback
    return {
      planName: 'free',
      status: 'free',
      limits: FREE_PLAN_LIMITS,
      currentUsage: {
        projectCount: 0,
        messageCount: 0,
      },
    };
  }
}

/**
 * Check if user can create a new project
 */
export async function canCreateProject(organizationId: string): Promise<{ allowed: boolean; reason?: string }> {
  const planInfo = await getUserPlanInfo(organizationId);

  if (planInfo.limits.maxProjects === -1) {
    return { allowed: true }; // Unlimited
  }

  if (planInfo.currentUsage.projectCount >= planInfo.limits.maxProjects) {
    return {
      allowed: false,
      reason: `You've reached the maximum number of projects (${planInfo.limits.maxProjects}) for your current plan. Upgrade to Pro for unlimited projects.`
    };
  }

  return { allowed: true };
}

/**
 * Check if user can send a message
 */
export async function canSendMessage(organizationId: string): Promise<{ allowed: boolean; reason?: string }> {
  const planInfo = await getUserPlanInfo(organizationId);

  if (planInfo.limits.maxMessages === -1) {
    return { allowed: true }; // Unlimited
  }

  if (planInfo.currentUsage.messageCount >= planInfo.limits.maxMessages) {
    return {
      allowed: false,
      reason: `You've reached the maximum number of messages (${planInfo.limits.maxMessages}) for your current plan. Upgrade to Pro for unlimited messaging.`
    };
  }

  return { allowed: true };
}

/**
 * Get remaining usage for display purposes
 */
export async function getRemainingUsage(organizationId: string): Promise<{
  remainingProjects: number | 'unlimited';
  remainingMessages: number | 'unlimited';
}> {
  const planInfo = await getUserPlanInfo(organizationId);

  return {
    remainingProjects: planInfo.limits.maxProjects === -1
      ? 'unlimited'
      : Math.max(0, planInfo.limits.maxProjects - planInfo.currentUsage.projectCount),
    remainingMessages: planInfo.limits.maxMessages === -1
      ? 'unlimited'
      : Math.max(0, planInfo.limits.maxMessages - planInfo.currentUsage.messageCount),
  };
}

export const FREE_PLAN_VAULT_LIMIT = 3;

/**
 * Check if a free-plan user can upload another document to the vault.
 * Pro/Enterprise/Explorer/Trial accounts have no limit.
 */
export async function canUploadDocument(
  organizationId: string,
  userId: string
): Promise<{ allowed: boolean; reason?: string; current: number; limit: number }> {
  const planInfo = await getUserPlanInfo(organizationId);

  if (planInfo.limits.hasProAccess) {
    return { allowed: true, current: 0, limit: -1 };
  }

  const docCount = await prisma.document.count({
    where: {
      organization_id: organizationId,
      created_by: userId,
      status: 'active',
    },
  });

  if (docCount >= FREE_PLAN_VAULT_LIMIT) {
    return {
      allowed: false,
      reason: `Free accounts can upload up to ${FREE_PLAN_VAULT_LIMIT} documents. Upgrade to Pro for unlimited uploads.`,
      current: docCount,
      limit: FREE_PLAN_VAULT_LIMIT,
    };
  }

  return { allowed: true, current: docCount, limit: FREE_PLAN_VAULT_LIMIT };
}

/**
 * Check if user can use AI Associates (premium feature)
 */
export async function canUseAssociates(organizationId: string): Promise<{ allowed: boolean; reason?: string }> {
  const planInfo = await getUserPlanInfo(organizationId);

  if (planInfo.limits.hasProAccess) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'AI Associates are a premium feature. Upgrade to Explorer or Pro to use associates in chat.'
  };
}