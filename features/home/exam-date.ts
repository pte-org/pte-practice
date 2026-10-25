/**
 * Formats an ISO date string (YYYY-MM-DD) into locale-sensitive display format.
 * - Vietnamese: "7 tháng 11" (same year) or "7 tháng 11, 2027" (future/past year).
 * - English: "7 November" (same year) or "7 November 2027" (future/past year).
 * Parses date parts directly using UTC projection to avoid browser timezone date shift.
 */
export function formatExamDate(
  isoDate: string | null | undefined,
  locale = "vi",
  today = new Date(),
): string | null {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const [yearStr, monthStr, dayStr] = isoDate.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) return null;

  const currentYear = today.getFullYear();
  const isCurrentYear = year === currentYear;

  if (locale.startsWith("vi")) {
    return isCurrentYear ? `${day} tháng ${month}` : `${day} tháng ${month}, ${year}`;
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const monthName = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(utcDate);
  return isCurrentYear ? `${day} ${monthName}` : `${day} ${monthName} ${year}`;
}

/**
 * Computes min and max selectable exam date strings (YYYY-MM-DD) for date inputs.
 * - min: today
 * - max: today + 2 years
 */
export function examDateBounds(today = new Date()): { min: string; max: string } {
  const pad = (n: number) => String(n).padStart(2, "0");
  const formatDateString = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const min = formatDateString(today);
  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + 2);
  const max = formatDateString(maxDate);

  return { min, max };
}
