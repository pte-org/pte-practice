import { NAV_ITEMS, PRACTICE_ROUTES } from "@/features/practice/constants";

/**
 * Which rail item a path lights up. The answer review is the one page that is not a destination of its own: it
 * belongs to wherever the student opened it from, which only that page knows, so it lights nothing by itself and
 * names its item through {@link ../shell/ActiveNav useActiveNav} instead.
 */
export function defaultNavHref(pathname: string): string | null {
  if (pathname === PRACTICE_ROUTES.practiceReview) return null;
  const item = NAV_ITEMS.find((entry) => (entry.href === PRACTICE_ROUTES.home
    ? pathname === entry.href
    : pathname.startsWith(entry.href)));
  return item?.href ?? null;
}
