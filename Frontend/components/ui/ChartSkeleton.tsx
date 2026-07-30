import React from 'react';

interface ChartSkeletonProps {
  height?: number;
  titleWidth?: string;
}

const ChartSkeleton: React.FC<ChartSkeletonProps> = ({ height = 300, titleWidth = 'w-48' }) => (
  <div className="bg-white p-6 rounded-xl shadow-md min-w-0">
    <div className={`h-5 ${titleWidth} bg-slate-200 rounded animate-pulse mb-4`} />
    <div className="w-full bg-slate-100 rounded-lg animate-pulse" style={{ height }} />
  </div>
);

export default ChartSkeleton;
