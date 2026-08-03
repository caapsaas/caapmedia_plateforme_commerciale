import React from 'react';

const KpiCardSkeleton: React.FC = () => (
  <div className="bg-white p-6 rounded-xl shadow-md flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
      <div className="h-8 w-8 bg-slate-200 rounded-full animate-pulse" />
    </div>
    <div>
      <div className="h-7 w-20 bg-slate-200 rounded animate-pulse mt-2" />
      <div className="h-5 w-14 bg-slate-200 rounded-full animate-pulse mt-2" />
    </div>
  </div>
);

export default KpiCardSkeleton;
