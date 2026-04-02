"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 10;

interface ReviewsPaginationProps {
  totalCount: number;
  currentPage: number;
}

export function ReviewsPagination({
  totalCount,
  currentPage,
}: ReviewsPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  if (totalPages <= 1) return null;

  function goTo(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("reviewPage", String(page));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => goTo(currentPage - 1)}
      >
        Προηγούμενο
      </Button>
      <span className="text-sm text-muted-foreground">
        {currentPage} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => goTo(currentPage + 1)}
      >
        Επόμενο
      </Button>
    </div>
  );
}
