import React from 'react';
import TableSkeleton from './TableSkeleton';

interface CrmListSkeletonProps {
    columns?: number;
    rows?: number;
}

const CrmListSkeleton: React.FC<CrmListSkeletonProps> = ({ columns = 6, rows = 8 }) => (
    <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4">
            <div className="h-6 bg-slate-200 rounded w-40 animate-pulse" />
            <div className="h-9 bg-slate-200 rounded w-32 animate-pulse" />
        </div>
        <div className="overflow-x-auto">
            <table className="w-full">
                <tbody>
                    <TableSkeleton rows={rows} columns={columns} />
                </tbody>
            </table>
        </div>
    </div>
);

export default CrmListSkeleton;
