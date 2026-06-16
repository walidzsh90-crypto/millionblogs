"use client";

type ArticlePaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function ArticlePagination({ page, pageSize, total, onPageChange }: ArticlePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  function range() {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="min-h-10 rounded-md border border-border px-3 text-sm font-medium text-foreground disabled:opacity-40"
        aria-label="Previous page"
      >
        Prev
      </button>

      {range()[0] > 1 && (
        <>
          <button
            type="button"
            onClick={() => onPageChange(1)}
            className="min-h-10 rounded-md border border-border px-3 text-sm font-medium text-foreground"
          >
            1
          </button>
          {range()[0] > 2 && <span className="px-1 text-muted">...</span>}
        </>
      )}

      {range().map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={`min-h-10 rounded-md border px-3 text-sm font-medium ${
            p === page
              ? "border-primary bg-primary text-white"
              : "border-border text-foreground"
          }`}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </button>
      ))}

      {range()[range().length - 1] < totalPages && (
        <>
          {range()[range().length - 1] < totalPages - 1 && (
            <span className="px-1 text-muted">...</span>
          )}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            className="min-h-10 rounded-md border border-border px-3 text-sm font-medium text-foreground"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="min-h-10 rounded-md border border-border px-3 text-sm font-medium text-foreground disabled:opacity-40"
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  );
}
