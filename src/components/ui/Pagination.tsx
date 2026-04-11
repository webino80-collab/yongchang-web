import { clsx } from "clsx";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const range = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const getPages = () => {
    if (totalPages <= 7) return range(1, totalPages);
    if (page <= 4) return [...range(1, 5), "...", totalPages];
    if (page >= totalPages - 3)
      return [1, "...", ...range(totalPages - 4, totalPages)];
    return [1, "...", ...range(page - 1, page + 1), "...", totalPages];
  };

  return (
    <nav className="flex items-center justify-center gap-1 mt-6" aria-label="페이지 내비게이션">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1.5 text-sm rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
      >
        이전
      </button>

      {getPages().map((p, idx) =>
        p === "..." ? (
          <span key={`dot-${idx}`} className="px-2 py-1 text-gray-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={clsx(
              "px-3 py-1.5 text-sm rounded-md border",
              page === p
                ? "bg-indigo-600 text-white border-indigo-600"
                : "border-gray-300 hover:bg-gray-50"
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1.5 text-sm rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
      >
        다음
      </button>
    </nav>
  );
}
