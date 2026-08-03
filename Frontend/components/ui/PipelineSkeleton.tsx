import React from 'react';

const OpportunityCardSkeleton: React.FC = () => (
    <div className="bg-white rounded-md shadow p-4 border-l-4 border-slate-200 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-slate-200 rounded w-1/2 mb-3" />
        <div className="h-5 bg-slate-200 rounded w-2/3 mb-2" />
        <div className="h-3 bg-slate-200 rounded w-1/3" />
    </div>
);

const ColumnSkeleton: React.FC<{ cardCount: number }> = ({ cardCount }) => (
    <div className="w-72 bg-slate-100 rounded-lg flex-shrink-0 flex flex-col">
        <div className="p-3 border-b border-slate-300">
            <div className="h-4 bg-slate-200 rounded w-24 mb-2 animate-pulse" />
            <div className="h-3 bg-slate-200 rounded w-32 animate-pulse" />
        </div>
        <div className="mt-4 space-y-3 p-2">
            {Array.from({ length: cardCount }).map((_, i) => (
                <OpportunityCardSkeleton key={i} />
            ))}
        </div>
    </div>
);

const PipelineSkeleton: React.FC = () => {
    const cardCounts = [3, 2, 2, 1, 1];
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="h-7 bg-slate-200 rounded w-40 animate-pulse" />
                <div className="h-9 bg-slate-200 rounded w-40 animate-pulse" />
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-4">
                {cardCounts.map((count, i) => (
                    <ColumnSkeleton key={i} cardCount={count} />
                ))}
            </div>
        </div>
    );
};

export default PipelineSkeleton;
