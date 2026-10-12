import { useEffect, useMemo, useState } from 'react';
import { PAGE_SIZE } from '../constants.js';

/** Slices `items` to the current page and resets to page 1 whenever the input list changes size/identity. */
export function usePagination(items, pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => { setPage(1); }, [items.length]);

  const safePage = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  );

  return { page: safePage, pageCount, setPage, pageItems };
}
