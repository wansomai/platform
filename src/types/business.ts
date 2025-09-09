// Business domain types for dashboard and insights

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department?: string;
}

export interface BusinessMessage {
  id: string;
  from: string;
  subject: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  content?: string;
}

export interface Competitor {
  id: string;
  name: string;
  website: string;
  marketShare?: number;
  strengths: string[];
  weaknesses: string[];
  revenue?: number;
  employees?: number;
}

export interface PerformanceData {
  date: string;
  value: number;
  category: string;
  trend: 'up' | 'down' | 'stable';
}

export interface BusinessMetric {
  name: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  period: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
}