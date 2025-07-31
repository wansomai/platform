// components/dashboard/PerformanceChart.tsx
'use client'
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, ChevronDown, BarChart3, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PerformanceData {
  date: string;
  clicks: number;
  content: number;
  messages?: number; // Changed from position to messages
}

interface PerformanceChartProps {
  data?: PerformanceData[];
  title?: string;
  showTimeFilters?: boolean;
  showExport?: boolean;
  defaultTimeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  onExport?: () => void;
  height?: number;
  className?: string;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data = defaultData,
  title = "Performance",
  showTimeFilters = true,
  showExport = true,
  defaultTimeRange = '28d',
  onTimeRangeChange,
  onExport,
  height = 320,
  className = ""
}) => {
  const [timeRange, setTimeRange] = useState(defaultTimeRange);
  const [activeMetrics, setActiveMetrics] = useState({
    clicks: true,
    content: true,
    messages: false // Changed from position
  });

  const timeRangeOptions = [
    { value: '24h', label: '24 hours' },
    { value: '7d', label: '7 days' },
    { value: '28d', label: '28 days' },
    { value: '3m', label: '3 months' },
    { value: '6m', label: '6 months' },
    { value: '1y', label: '1 year' }
  ];

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    onTimeRangeChange?.(range);
  };

  const toggleMetric = (metric: keyof typeof activeMetrics) => {
    setActiveMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  // Calculate totals - updated for messages
  const totals = data.reduce(
    (acc, item) => ({
      clicks: acc.clicks + item.clicks,
      content: acc.content + item.content,
      messages: acc.messages + (item.messages || 0) // Changed from position
    }),
    { clicks: 0, content: 0, messages: 0 }
  );



  // Updated metrics array - changed from position to messages
  const metrics = [
    {
      key: 'clicks' as const,
      label: 'Total Page Views',
      value: totals.clicks.toLocaleString(),
      color: '#3b82f6',
      yAxisId: 'left'
    },
    {
      key: 'content' as const,
      label: 'Total Content',
      value: totals.content.toLocaleString(),
      color: '#8b5cf6',
      yAxisId: 'right'
    },
    {
      key: 'messages' as const, // Changed from position
      label: 'Total Messages', // Changed label
      value: totals.messages.toLocaleString(), // Changed calculation
      color: '#f59e0b',
      yAxisId: 'right'
    }
  ];

  return (
    <Card className={className}>
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-semibold text-gray-900">{title}</CardTitle>
        {showExport && (
          <Button variant="outline" size="sm" onClick={onExport} className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span className="text-sm">Export</span>
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
      
          <>
            {/* Time Range Filters */}
            {showTimeFilters && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  {timeRangeOptions.slice(0, 4).map((option) => (
                    <Button
                      key={option.value}
                      variant={timeRange === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTimeRangeChange(option.value)}
                      className="text-sm"
                    >
                      {option.label}
                    </Button>
                  ))}
                  
                  {/* More Options Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center">
                        More
                        <ChevronDown className="ml-1 w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {timeRangeOptions.slice(4).map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => handleTimeRangeChange(option.value)}
                          className={timeRange === option.value ? 'bg-accent' : ''}
                        >
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metrics.map((metric) => (
                <div key={metric.key} className="p-4 border rounded-lg bg-card">
                  <div className="flex items-center mb-2">
                    <input 
                      type="checkbox" 
                      checked={activeMetrics[metric.key]}
                      onChange={() => toggleMetric(metric.key)}
                      className="w-4 h-4 mr-2 cursor-pointer"
                      style={{ accentColor: metric.color }}
                    />
                    <span className="text-sm text-muted-foreground">{metric.label}</span>
                  </div>
                  <div className={`text-2xl font-bold ${
                    activeMetrics[metric.key] ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div style={{ height }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af"
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />
                  
                  {/* Left Y Axis */}
                  <YAxis 
                    yAxisId="left"
                    stroke="#9ca3af"
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    domain={[0, 100]}
                    label={{ 
                      value: 'Page Views', 
                      angle: -90, 
                      position: 'insideLeft', 
                      style: { textAnchor: 'middle', fontSize: '12px', fill: '#6b7280' } 
                    }}
                  />
                  
                  {/* Right Y Axis */}
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#9ca3af"
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    domain={[0, 100]}  // Set fixed domain from 0 to 100
                    label={{ 
                      value: 'Content / Messages', // Updated label
                      angle: 90, 
                      position: 'insideRight', 
                      style: { textAnchor: 'middle', fontSize: '12px', fill: '#6b7280' } 
                    }}
                  />
                  
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }}
                  />
                  
                  {/* Lines */}
                  {activeMetrics.clicks && (
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="clicks" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, fill: '#3b82f6' }}
                      name="Page Views"
                    />
                  )}
                  
                  {activeMetrics.content && (
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="content" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, fill: '#8b5cf6' }}
                      name="Content"
                    />
                  )}
                  
                  {activeMetrics.messages && ( // Changed from position
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="messages" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b', strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, fill: '#f59e0b' }}
                      name="Messages"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
      </CardContent>
    </Card>
  );
};

// Updated default data - starting from 31/7/2025 with zeros for new clients
const defaultData: PerformanceData[] = [
  { date: '7/31/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/1/25', clicks: 0, content: 1, messages: 0 },
  { date: '8/2/25', clicks: 3, content: 2, messages: 0 },
  { date: '8/3/25', clicks: 0, content: 3, messages: 0 },
  { date: '8/4/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/5/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/6/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/7/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/8/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/9/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/10/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/11/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/12/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/13/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/14/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/15/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/16/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/17/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/18/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/19/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/20/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/21/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/22/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/23/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/24/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/25/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/26/25', clicks: 0, content: 0, messages: 0 },
  { date: '8/27/25', clicks: 0, content: 0, messages: 0 }
];

export default PerformanceChart;