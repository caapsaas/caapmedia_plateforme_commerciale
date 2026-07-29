import React from 'react';

interface TableSkeletonProps {
  rows: number;
  columns: number;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows, columns }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx}>
          {Array.from({ length: columns }).map((_, colIdx) => (
            <td key={colIdx} className="px-4 py-3">
              <div
                className={`h-4 bg-slate-200 rounded animate-pulse ${
                  colIdx === 0 ? 'w-16' : colIdx === columns - 1 ? 'w-20' : 'w-24'
                }`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export default TableSkeleton;
