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
 * Formats an ISO date string (YYYY-MM-DD) into short headline format matching the picker:
 * - Vietnamese: "25 thg 11" (same year) or "25 thg 11, 2027" (other year).
 * - English: "Nov 25" (same year) or "Nov 25, 2027" (other year).
 */
export function formatShortExamDate(
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
    return isCurrentYear ? `${day} thg ${month}` : `${day} thg ${month}, ${year}`;
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const monthShort = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(utcDate);
  return isCurrentYear ? `${monthShort} ${day}` : `${monthShort} ${day}, ${year}`;
}

/** Formats month title for the calendar navigation, e.g. "Tháng 11 2026" or "November 2026". */
export function formatMonthYearHeader(
  year: number,
  monthIndex: number,
  locale = "vi",
): string {
  if (locale.startsWith("vi")) {
    return `Tháng ${monthIndex + 1} ${year}`;
  }
  const date = new Date(Date.UTC(year, monthIndex, 1));
  const monthName = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(date);
  return `${monthName} ${year}`;
}

/** Returns 7 weekday labels starting with Sunday. */
export function getWeekdayLabels(locale = "vi"): string[] {
  if (locale.startsWith("vi")) {
    return ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  }
  return ["S", "M", "T", "W", "T", "F", "S"];
}

export interface CalendarMonthCell {
  day: number;
  dateStr: string;
  isDisabled: boolean;
  isToday: boolean;
  isSelected: boolean;
}

/** Builds calendar grid cells for a given month and bounds. */
export function buildCalendarDays(
  year: number,
  monthIndex: number,
  selectedDate: string,
  minDate: string,
  maxDate: string,
  todayStr: string,
): { leadingBlankCount: number; days: CalendarMonthCell[] } {
  const pad = (n: number) => String(n).padStart(2, "0");
  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const days: CalendarMonthCell[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(monthIndex + 1)}-${pad(d)}`;
    days.push({
      day: d,
      dateStr,
      isDisabled: dateStr < minDate || dateStr > maxDate,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDate,
    });
  }

  return { leadingBlankCount: firstDayOfWeek, days };
}

/**
 * Computes min and max selectable exam date strings (YYYY-MM-DD) for date inputs.
 * - min: today
 * - max: today + 2 years
 */
export function examDateBounds(today = new Date()): { min: string; max: string; todayStr: string } {
  const pad = (n: number) => String(n).padStart(2, "0");
  const formatDateString = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const min = formatDateString(today);
  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + 2);
  const max = formatDateString(maxDate);

  return { min, max, todayStr: min };
}
