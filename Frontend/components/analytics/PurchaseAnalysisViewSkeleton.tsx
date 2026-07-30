import React from 'react';
import KpiCardSkeleton from '../ui/KpiCardSkeleton';
import TableSkeleton from '../ui/TableSkeleton';

const PurchaseAnalysisViewSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => <KpiCardSkeleton key={i} />)}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md">
        <div className="h-5 w-40 bg-slate-200 rounded animate-pulse mb-4" />
        <div className="w-full bg-slate-100 rounded-lg animate-pulse" style={{ height: 300 }} />
      </div>
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
        <div className="h-5 w-36 bg-slate-200 rounded animate-pulse mb-4" />
        <div className="w-full bg-slate-100 rounded-lg animate-pulse" style={{ height: 300 }} />
      </div>
    </div>

    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="h-5 w-44 bg-slate-200 rounded animate-pulse mb-4" />
      <div className="overflow-x-auto">
        <table className="w-full">
          <tbody><TableSkeleton rows={5} columns={3} /></tbody>
        </table>
      </div>
    </div>
  </div>
);

export default PurchaseAnalysisViewSkeleton;
