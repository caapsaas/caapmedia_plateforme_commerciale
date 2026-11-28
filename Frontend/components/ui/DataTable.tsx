import React from 'react';
import { cn } from '../../utils/cn';
import TableSkeleton from './TableSkeleton';
import EmptyState from './EmptyState';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  numeric?: boolean;
  width?: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  className?: string;
}

function DataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  onRowClick,
  emptyTitle = 'Aucune donnée',
  emptyDescription,
  emptyAction,
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return <TableSkeleton columns={columns.length} rows={6} />;
  }

  if (data.length === 0) {
    return (
      <div className="bg-white border border-[var(--border)] rounded-[var(--radius-md)] py-10 px-4">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white border border-[var(--border)] rounded-[var(--radius-md)] overflow-hidden shadow-2xs',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-[var(--muted)] border-b border-[var(--border)]">
            <tr>
              {columns.map((col) => {
                const align = col.align ?? (col.numeric ? 'right' : 'left');
                return (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(
                      'px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] whitespace-nowrap',
                      align === 'right' && 'text-right',
                      align === 'center' && 'text-center',
                    )}
                  >
                    {col.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] text-[13px] text-[var(--foreground)]">
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'transition-colors duration-100',
                  onRowClick
                    ? 'cursor-pointer hover:bg-slate-50/90'
                    : 'hover:bg-slate-50/50',
                )}
              >
                {columns.map((col) => {
                  const align = col.align ?? (col.numeric ? 'right' : 'left');
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 align-middle',
                        col.numeric && 'tabular-nums font-medium',
                        align === 'right' && 'text-right',
                        align === 'center' && 'text-center',
                      )}
                    >
                      {col.render(row)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
