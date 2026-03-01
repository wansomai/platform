'use client';

import { FileText, CheckCircle, Layers, Globe } from 'lucide-react';

interface LegalKnowledgeStatsProps {
  stats: {
    total: number;
    published: number;
    byType: Record<string, number>;
    byJurisdiction: Record<string, number>;
    totalChunks: number;
  };
  isLoading: boolean;
}

export function LegalKnowledgeStats({ stats, isLoading }: LegalKnowledgeStatsProps) {
  const statCards = [
    {
      title: 'Total Documents',
      value: stats.total,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Published',
      value: stats.published,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Jurisdictions',
      value: Object.keys(stats.byJurisdiction).length,
      icon: Globe,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((stat) => (
        <div
          key={stat.title}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-600">{stat.title}</p>
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
