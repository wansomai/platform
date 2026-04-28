// Admin Panel TypeScript Types

export type FilterType = 'all' | 'pending' | 'upgraded';

export type UpgradeStatus = 'none' | 'pending' | 'approved';

export type AccountType = 'personal' | 'enterprise';

export interface AdminOrganization {
  id: string;
  name: string;
  accountType: AccountType;
  upgradeStatus: UpgradeStatus;
  upgradeRequestToken: string | null;
  upgradeRequestedAt: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  owner: {
    id: string;
    email: string;
    fullName: string | null;
  } | null;
  memberCount: number;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
  grantedAt: string | null;
  grantedExpiresAt: string | null;
  grantedExpired: boolean;
  grantedDuration: string | null;
}

export interface AdminOrganizationDetails extends AdminOrganization {
  members: Array<{
    user: {
      id: string;
      email: string;
      fullName: string | null;
    };
    role: string;
    joinedAt: string;
  }>;
  subscription: {
    id: string;
    planName: string;
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    billingCycle: string | null;
  } | null;
  projects: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
  onboardingCompleted: boolean;
  profileStatus: string;
  practiceAreas: string[];
  firmSize: string | null;
  currentWebsite: string | null;
  linkedinUrl: string | null;
}

export interface AdminStats {
  totalOrgs: number;
  pendingUpgrades: number;
  enterpriseAccounts: number;
  personalAccounts: number;
}

export interface OrganizationsResponse {
  organizations: AdminOrganization[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: AdminStats;
}

export interface OrganizationDetailsResponse {
  organization: AdminOrganizationDetails;
}

export interface ActionResponse {
  success: boolean;
  message: string;
}
