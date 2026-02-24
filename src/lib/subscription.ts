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
  maxMessages: 5,
  hasProAccess: false,
};

// Pro plan limits
const PRO_PLAN_LIMITS: SubscriptionLimits = {
  maxProjects: -1, // unlimited
  maxMessages: -1, // unlimited
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
        select: { accountType: true }
      })
    ]);

    // Determine plan from subscription + org type before counting usage
    const hasActiveSubscription = subscription &&
      ['active', 'non_renewing'].includes(subscription.status) &&
      ['professional', 'enterprise', 'pro'].includes(subscription.planName.toLowerCase());

    const isEnterpriseAccount = organization?.accountType === 'enterprise';
    const isProPlan = hasActiveSubscription || isEnterpriseAccount;

    const planName = isEnterpriseAccount ? 'enterprise' : (subscription?.planName || 'free');
    const status = isEnterpriseAccount ? 'active' : (subscription?.status || 'free');

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
    reason: 'AI Associates are a premium feature. Upgrade to Enterprise to use associates in chat.'
  };
}