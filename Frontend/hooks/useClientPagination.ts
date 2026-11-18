import { useEffect, useMemo, useState } from 'react';
import { PaginationMeta } from '../types/pagination.types';

/** Client-side paging for filtered lists that are already loaded in memory. */
export function useClientPagination<T>(items: readonly T[], pageSize = 10) {
  const [requestedPage, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const page = Math.min(requestedPage, totalPages);

  useEffect(() => {
    if (requestedPage > totalPages) setPage(totalPages);
  }, [requestedPage, totalPages]);

  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );
  const meta: PaginationMeta = useMemo(() => ({
    page,
    limit: pageSize,
    total: items.length,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }), [page, pageSize, items.length, totalPages]);

  return { pageItems, page, setPage, meta };
}
