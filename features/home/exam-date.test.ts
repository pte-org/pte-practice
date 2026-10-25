import { describe, expect, it } from "vitest";
import { examDateBounds, formatExamDate } from "./exam-date";

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

describe("examDateBounds", () => {
  it("returns min as today and max as two years from today", () => {
    const today = new Date(2026, 9, 25); // Oct 25, 2026
    const bounds = examDateBounds(today);
    expect(bounds.min).toBe("2026-10-25");
    expect(bounds.max).toBe("2028-10-25");
  });
});
