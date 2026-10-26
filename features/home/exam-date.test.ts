import { describe, expect, it } from "vitest";
import {
  buildCalendarDays,
  examDateBounds,
  formatExamDate,
  formatMonthYearHeader,
  formatShortExamDate,
  getWeekdayLabels,
} from "./exam-date";

describe("formatExamDate", () => {
  const currentYearDate = new Date("2026-10-25T10:00:00Z");

  it("formats Vietnamese date in the same year without year suffix", () => {
    expect(formatExamDate("2026-11-07", "vi", currentYearDate)).toBe("7 tháng 11");
  });

  it("formats Vietnamese date in a different year with year suffix", () => {
    expect(formatExamDate("2027-11-07", "vi", currentYearDate)).toBe("7 tháng 11, 2027");
  });

  it("formats English date in the same year without year suffix", () => {
    expect(formatExamDate("2026-11-07", "en", currentYearDate)).toBe("7 November");
  });

  it("formats English date in a different year with year suffix", () => {
    expect(formatExamDate("2027-11-07", "en", currentYearDate)).toBe("7 November 2027");
  });

  it("handles single-digit days and months correctly", () => {
    expect(formatExamDate("2026-05-03", "vi", currentYearDate)).toBe("3 tháng 5");
    expect(formatExamDate("2026-05-03", "en", currentYearDate)).toBe("3 May");
  });

  it("returns null for invalid or empty inputs", () => {
    expect(formatExamDate(null)).toBeNull();
    expect(formatExamDate("")).toBeNull();
    expect(formatExamDate("not-a-date")).toBeNull();
    expect(formatExamDate("2026-99-99")).toBeNull();
  });
});

describe("formatShortExamDate", () => {
  const currentYearDate = new Date("2026-10-25T10:00:00Z");

  it("formats Vietnamese short date matching screenshot: '25 thg 11'", () => {
    expect(formatShortExamDate("2026-11-25", "vi", currentYearDate)).toBe("25 thg 11");
  });

  it("formats Vietnamese short date with year when in a different year", () => {
    expect(formatShortExamDate("2027-11-25", "vi", currentYearDate)).toBe("25 thg 11, 2027");
  });

  it("formats English short date", () => {
    expect(formatShortExamDate("2026-11-25", "en", currentYearDate)).toBe("Nov 25");
  });

  it("returns null for invalid date strings", () => {
    expect(formatShortExamDate(null)).toBeNull();
    expect(formatShortExamDate("invalid")).toBeNull();
  });
});

describe("formatMonthYearHeader", () => {
  it("formats Vietnamese month/year header matching screenshot: 'Tháng 11 2026'", () => {
    expect(formatMonthYearHeader(2026, 10, "vi")).toBe("Tháng 11 2026");
  });

  it("formats English month/year header", () => {
    expect(formatMonthYearHeader(2026, 10, "en")).toBe("November 2026");
  });
});

describe("getWeekdayLabels", () => {
  it("returns Vietnamese 7-day labels matching screenshot", () => {
    expect(getWeekdayLabels("vi")).toEqual(["CN", "T2", "T3", "T4", "T5", "T6", "T7"]);
  });

  it("returns English 7-day labels", () => {
    expect(getWeekdayLabels("en")).toEqual(["S", "M", "T", "W", "T", "F", "S"]);
  });
});

describe("buildCalendarDays", () => {
  it("builds correct grid for November 2026 (Nov 1 is Sunday)", () => {
    const grid = buildCalendarDays(
      2026,
      10, // November
      "2026-11-25",
      "2026-10-26",
      "2028-10-26",
      "2026-10-26",
    );
    expect(grid.leadingBlankCount).toBe(0); // Sunday starts at index 0
    expect(grid.days).toHaveLength(30);
    const day25 = grid.days.find((d) => d.day === 25);
    expect(day25?.isSelected).toBe(true);
    expect(day25?.isDisabled).toBe(false);
  });
});

describe("examDateBounds", () => {
  it("returns min as today and max as two years from today", () => {
    const today = new Date(2026, 9, 25); // Oct 25, 2026
    const bounds = examDateBounds(today);
    expect(bounds.min).toBe("2026-10-25");
    expect(bounds.max).toBe("2028-10-25");
    expect(bounds.todayStr).toBe("2026-10-25");
  });
});

