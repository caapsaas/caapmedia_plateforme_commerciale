import React from 'react';
import KpiCardSkeleton from '../ui/KpiCardSkeleton';
import ChartSkeleton from '../ui/ChartSkeleton';

const DashboardViewSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
  </div>
);

export default DashboardViewSkeleton;
