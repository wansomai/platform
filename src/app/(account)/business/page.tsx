// app/business/page.tsx 
'use client'
import { useSession } from "next-auth/react";
import ContentPagesTable from '@/components//business/dashboard/ContentTable';
import PerformanceChart from '@/components//business/dashboard/PerformanceChart';
import CompetitorInsights from '@/components/business/CompetitorInsights';
import RecentMessages from '@/components/business/RecentMessages';

const Dashboard = () => {
  const { data: session } = useSession();
  const user = session?.user;

  const competitorData : any = [

  ];

  const keywordData : any = [

  ];

  // Handlers for AiPagesTable
  const handleCreateNew = () => {
    // Redirect to content creation page or open modal
  };

  const handleDelete = (page: any) => {
    // Show confirmation modal and handle deletion
  };

  const handleView = (page: any) => {
    // Open page in new tab or redirect
  };

  const handleTimeRangeChange = (range: string) => {
    // Handle time range change - fetch new data, etc.
  };

  const handleExport = () => {
    // Handle data export
  };

  const handleViewFullReport = () => {
    // Navigate to full competitor report page
  };

  const handleViewAllMessages = () => {
    // Navigate to messages page
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Performance Chart */}
      <PerformanceChart 
        title="Performance Overview"
        onTimeRangeChange={handleTimeRangeChange}
        onExport={handleExport}
        className="mb-8"
      />

      {/* AI Generated Pages Table */}
      <div className="mt-8">
        <ContentPagesTable 
          showCreateButton={true}
          onCreateNew={handleCreateNew}
          onDelete={handleDelete}
          onView={handleView}
          itemsPerPage={6}
          
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Competitor Insights Component */}
        <CompetitorInsights 
          competitors={competitorData}
          onViewFullReport={handleViewFullReport}
        />

        {/* Top Keywords Component */}
        <RecentMessages 
          messages={keywordData}
          onViewAllMessages={handleViewAllMessages}
        />
      </div>
    </div>
  );
};

export default Dashboard;