import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export const Pagination: React.FC<Props> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-xs text-[#999999] bg-[#FAFAFA] border-t border-[#EEEEEE]">
      <div className="flex items-center gap-3">
        <span>
          Showing <strong className="text-[#1A1A1A] font-semibold">{startItem}</strong> to{' '}
          <strong className="text-[#1A1A1A] font-semibold">{endItem}</strong> of{' '}
          <strong className="text-[#1A1A1A] font-semibold">{totalItems}</strong> entries
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-2 ml-4">
            <span className="text-xs text-[#999999]">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-white border border-[#EEEEEE] text-[#1A1A1A] text-xs rounded-lg px-2 py-1 focus:border-[#B88E8D] outline-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="w-8 h-8 flex items-center justify-center border border-[#EEEEEE] rounded-lg text-[#999999] hover:bg-white hover:text-[#1A1A1A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            if (
              p === 1 ||
              p === totalPages ||
              (p >= currentPage - 1 && p <= currentPage + 1)
            ) {
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-8 h-8 flex items-center justify-center border rounded-lg text-xs font-medium transition-all ${
                    currentPage === p
                      ? 'border-[#B88E8D] bg-white text-[#B88E8D] font-bold shadow-xs'
                      : 'border-[#EEEEEE] bg-transparent text-[#1A1A1A] hover:bg-white'
                  }`}
                >
                  {p}
                </button>
              );
            } else if (
              (p === currentPage - 2 && currentPage > 3) ||
              (p === currentPage + 2 && currentPage < totalPages - 2)
            ) {
              return <span key={p} className="px-1 text-[#999999]">...</span>;
            }
            return null;
          })}

          <button
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="w-8 h-8 flex items-center justify-center border border-[#EEEEEE] rounded-lg text-[#999999] hover:bg-white hover:text-[#1A1A1A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
