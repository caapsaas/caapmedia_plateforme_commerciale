import React, { useState, useRef, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { Search, ChevronDown, Check, Loader2, X } from 'lucide-react';
import { PaginatedResponse } from '../../types/pagination.types';

export interface AsyncSelectProps<T> {
  queryKey: string;
  fetcher: (params: { page: number; limit: number; search?: string }) => Promise<PaginatedResponse<T>>;
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string;
  value: string | undefined | null;
  onChange: (value: string | undefined, option?: T) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  limit?: number;
  error?: string;
  isClearable?: boolean;
  defaultOptions?: T[];
}

export function AsyncSelect<T>({
  queryKey,
  fetcher,
  getOptionLabel,
  getOptionValue,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  label,
  disabled = false,
  className = '',
  limit = 10,
  error,
  isClearable = true,
  defaultOptions = [],
}: AsyncSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const { ref: inViewRef, inView } = useInView({
    rootMargin: '100px',
  });

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: [queryKey, debouncedSearch],
    queryFn: ({ pageParam }) => fetcher({ page: pageParam as number, limit, search: debouncedSearch }),
    getNextPageParam: (lastPage) => (lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined),
    initialPageParam: 1,
    enabled: isOpen || debouncedSearch !== '',
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allOptions = data?.pages.flatMap((page) => page?.data || []) || [];
  const combinedOptions = [...defaultOptions, ...allOptions];

  useEffect(() => {
    if (value) {
      const foundItem = combinedOptions.find((opt) => getOptionValue(opt) === value);
      if (foundItem) {
        setSelectedItem(foundItem);
      }
    } else {
      setSelectedItem(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, allOptions, defaultOptions]);

  const handleSelect = (option: T) => {
    setSelectedItem(option);
    onChange(getOptionValue(option), option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem(null);
    onChange(undefined);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}

      <div
        className={`relative w-full bg-white border ${error ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm min-h-[40px] flex items-center justify-between cursor-pointer focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 ${disabled ? 'bg-slate-100 cursor-not-allowed opacity-70' : ''}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 100);
            }
          }
        }}
      >
        <div className="flex-1 px-3 py-2 flex items-center overflow-hidden">
          {selectedItem ? (
            <span className="truncate text-slate-900 text-sm">{getOptionLabel(selectedItem)}</span>
          ) : (
            <span className="text-slate-400 text-sm">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center px-2 space-x-1">
          {isClearable && selectedItem && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="h-5 w-px bg-slate-200 mx-1"></div>
          <ChevronDown className="w-5 h-5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          <div className="px-2 py-2 sticky top-0 bg-white z-10 border-b border-slate-100">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                ref={inputRef}
                type="text"
                className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <ul className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <li className="px-4 py-8 flex justify-center items-center text-slate-500 space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span>Chargement...</span>
              </li>
            ) : allOptions.length === 0 ? (
              <li className="px-4 py-4 text-center text-slate-500">Aucun résultat trouvé.</li>
            ) : (
              <>
                {allOptions.map((option, index) => {
                  const isSelected = selectedItem ? getOptionValue(selectedItem) === getOptionValue(option) : false;
                  return (
                    <li
                      key={`${getOptionValue(option)}-${index}`}
                      className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 ${isSelected ? 'bg-blue-100 text-blue-700' : 'text-slate-900'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(option);
                      }}
                    >
                      <span className={`block truncate ${isSelected ? 'font-semibold' : 'font-normal'}`}>
                        {getOptionLabel(option)}
                      </span>
                      {isSelected && (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-700">
                          <Check className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </li>
                  );
                })}

                {hasNextPage && (
                  <li ref={inViewRef} className="px-4 py-8 flex justify-center items-center text-sm text-slate-500">
                    {isFetchingNextPage || isLoading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <span>Chargement de la suite...</span>
                      </div>
                    ) : (
                      <span>Faites défiler pour voir plus</span>
                    )}
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default AsyncSelect;
