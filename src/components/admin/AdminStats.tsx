'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, Users, Briefcase } from "lucide-react";
import type { AdminStats as AdminStatsType } from "@/types/admin";

interface AdminStatsProps {
  stats: AdminStatsType;
  isLoading?: boolean;
}

export function AdminStats({ stats, isLoading }: AdminStatsProps) {
  const statsData = [
    {
      title: "Total Organizations",
      value: stats.totalOrgs,
      icon: Building2,
      description: "All registered organizations",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Pending Upgrades",
      value: stats.pendingUpgrades,
      icon: TrendingUp,
      description: "Awaiting approval",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      badge: stats.pendingUpgrades > 0,
    },
    {
      title: "Enterprise Accounts",
      value: stats.enterpriseAccounts,
      icon: Briefcase,
      description: "Active enterprise tier",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Personal Accounts",
      value: stats.personalAccounts,
      icon: Users,
      description: "Free tier accounts",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-4 w-4 bg-gray-200 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded mb-1" />
              <div className="h-3 w-32 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                {stat.badge && stat.value > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    Action required
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
