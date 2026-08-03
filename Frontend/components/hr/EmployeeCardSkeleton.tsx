import React from 'react';

const EmployeeCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-slate-200 animate-pulse" />
        <div>
          <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
          <div className="h-3 w-20 bg-slate-200 rounded animate-pulse mt-2" />
        </div>
      </div>
    </div>

    <div className="flex gap-2 mb-4">
      <div className="h-5 w-16 bg-slate-200 rounded-full animate-pulse" />
      <div className="h-5 w-12 bg-slate-200 rounded-full animate-pulse" />
    </div>

    <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-slate-200">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <div className="h-3 w-14 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-20 bg-slate-200 rounded animate-pulse mt-2" />
        </div>
      ))}
    </div>

    <div className="flex gap-2 justify-end">
      <div className="h-7 w-16 bg-slate-200 rounded animate-pulse" />
      <div className="h-7 w-16 bg-slate-200 rounded animate-pulse" />
      <div className="h-7 w-16 bg-slate-200 rounded animate-pulse" />
    </div>
  </div>
);

export default EmployeeCardSkeleton;
