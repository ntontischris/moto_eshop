import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseHref: string;
  searchParams?: Record<string, string>;
}

function buildPageUrl(
  baseHref: string,
  page: number,
  searchParams: Record<string, string>,
): string {
  const params = new URLSearchParams(searchParams);
  if (page > 1) {
    params.set("page", String(page));
  } else {
    params.delete("page");
  }
  const qs = params.toString();
  return qs ? `${baseHref}?${qs}` : baseHref;
}

function generatePageNumbers(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);

  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  baseHref,
  searchParams = {},
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const { page: _page, ...restParams } = searchParams;
  const pageNumbers = generatePageNumbers(currentPage, totalPages);
  const navCls =
    "flex h-9 w-9 items-center justify-center rounded-md transition-colors";

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 py-8"
    >
      {currentPage > 1 ? (
        <Link
          href={buildPageUrl(baseHref, currentPage - 1, restParams)}
          className={cn(navCls, "border hover:bg-accent")}
          aria-label="Προηγούμενη σελίδα"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(navCls, "cursor-not-allowed border opacity-50")}>
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {pageNumbers.map((pageNum, index) => {
        if (pageNum === "ellipsis") {
          return (
            <span
              key={`ellipsis-${index}`}
              className={cn(navCls, "text-muted-foreground")}
            >
              ...
            </span>
          );
        }

        const isActive = pageNum === currentPage;
        return (
          <Link
            key={pageNum}
            href={buildPageUrl(baseHref, pageNum, restParams)}
            className={cn(
              navCls,
              "text-sm font-medium",
              isActive
                ? "bg-primary text-primary-foreground"
                : "border hover:bg-accent",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {pageNum}
          </Link>
        );
      })}

      {currentPage < totalPages ? (
        <Link
          href={buildPageUrl(baseHref, currentPage + 1, restParams)}
          className={cn(navCls, "border hover:bg-accent")}
          aria-label="Επόμενη σελίδα"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(navCls, "cursor-not-allowed border opacity-50")}>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
