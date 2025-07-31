// components/business/dashboard/CompetitorInsights.tsx
import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

interface Competitor {
  name: string;
  position: number;
  change: number;
  pages: number;
}

interface CompetitorInsightsProps {
  competitors: Competitor[];
  onViewFullReport?: () => void;
  className?: string;
}

const CompetitorInsights: React.FC<CompetitorInsightsProps> = ({
  competitors,
  onViewFullReport,
  className = ""
}) => {
  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Competitor Insights</h3>
        {competitors.length > 0 && (
          <button 
            onClick={onViewFullReport}
            className="text-primary text-sm hover:text-primary-hover"
          >
            View Full Report
          </button>
        )}
      </div>

      {competitors.length === 0 ? (
        // Empty State
        <div className="text-center py-12">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Competitor Data</h4>
          <p className="text-gray-500 max-w-sm mx-auto">
            We're still analyzing your legal practice. Competitor insights will appear here once data is available.
          </p>
        </div>
      ) : (
        // Competitor List
        <div className="space-y-4">
          {competitors.map((competitor, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  competitor.name === 'Your Firm' ? 'bg-primary' : 'bg-gray-400'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{competitor.name}</p>
                  <p className="text-sm text-gray-500">{competitor.pages} indexed pages</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">Pos {competitor.position}</p>
                <div className="flex items-center">
                  {competitor.change < 0 ? (
                    <ArrowDownRight className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${competitor.change < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(competitor.change)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompetitorInsights;