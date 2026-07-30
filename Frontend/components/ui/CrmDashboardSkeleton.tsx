import React from 'react';

const KpiCardSkeleton: React.FC = () => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 animate-pulse">
        <div className="flex items-center justify-between">
            <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded w-32" />
                <div className="h-8 bg-slate-200 rounded w-24" />
                <div className="h-3 bg-slate-200 rounded w-16" />
            </div>
            <div className="h-12 w-12 bg-slate-200 rounded-full" />
        </div>
    </div>
);

const FunnelBarSkeleton: React.FC = () => (
    <div className="space-y-2">
        <div className="flex justify-between">
            <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
            <div className="h-4 bg-slate-200 rounded w-8 animate-pulse" />
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3 animate-pulse" />
    </div>
);

const TaskItemSkeleton: React.FC = () => (
    <div className="space-y-2 py-2">
        <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-slate-200 rounded w-1/2 animate-pulse" />
    </div>
);

const CrmDashboardSkeleton: React.FC = () => {
    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
            </div>

            {/* Funnel + Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md border border-slate-100">
                    <div className="h-6 bg-slate-200 rounded w-48 mb-5 animate-pulse" />
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <FunnelBarSkeleton key={i} />
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-slate-100">
                    <div className="h-6 bg-slate-200 rounded w-32 mb-4 animate-pulse" />
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <TaskItemSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                <div className="h-6 bg-slate-200 rounded w-40 mb-4 animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="border-l-4 border-slate-200 pl-3 py-1 space-y-2">
                            <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
                            <div className="h-3 bg-slate-200 rounded w-full animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CrmDashboardSkeleton;
