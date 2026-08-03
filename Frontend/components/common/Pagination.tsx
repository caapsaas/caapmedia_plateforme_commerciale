import React from 'react';
import { PaginationMeta } from '../../types/pagination.types';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({ meta, onPageChange, className = '' }) => {
  if (!meta || meta.totalPages <= 1) return null;

  const { page, totalPages, hasNextPage, hasPreviousPage, total, limit } = meta;

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`w-10 h-10 flex items-center justify-center rounded-md transition-all duration-200 font-medium ${
            i === page ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {i}
        </button>,
      );
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-white border-t border-slate-200 mt-4 rounded-b-xl ${className}`}
    >
      <div className="text-sm text-slate-500 mb-4 sm:mb-0">
        Affichage de <span className="font-semibold text-slate-700">{(page - 1) * limit + 1}</span> à{' '}
        <span className="font-semibold text-slate-700">{Math.min(page * limit, total)}</span> sur{' '}
        <span className="font-semibold text-slate-700">{total}</span> résultats
      </div>

      <div className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPreviousPage}
          className={`px-3 py-2 rounded-md transition-all duration-200 flex items-center space-x-1 font-medium ${
            hasPreviousPage ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'
          }`}
        >
          <span>&larr;</span>
          <span className="hidden sm:inline">Précédent</span>
        </button>

        <div className="flex space-x-1 mx-2">{renderPageNumbers()}</div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className={`px-3 py-2 rounded-md transition-all duration-200 flex items-center space-x-1 font-medium ${
            hasNextPage ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'
          }`}
        >
          <span className="hidden sm:inline">Suivant</span>
          <span>&rarr;</span>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
