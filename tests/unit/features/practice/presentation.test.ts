import { describe, expect, it } from "vitest";
import { formatScore, itemStatusKey, scoreTone, sessionDisplayName, taskDisplayName } from "@/features/practice/presentation";

const t = (key: string) => ({
  "presentation.questions": "câu",
  "presentation.skillPractice": "Luyện {skill}",
  "skills.reading": "Đọc",
} as Record<string, string>)[key] ?? key;
const taskName = (code: string) => (code === "READ_ALOUD" ? "Read Aloud" : code);

describe("score display", () => {
  it("bands scores at 40 and 70 and keeps no-score apart from zero", () => {
    expect(scoreTone(null)).toBe("none");
    expect(scoreTone(0)).toBe("low");
    expect(scoreTone(39)).toBe("low");
    expect(scoreTone(40)).toBe("mid");
    expect(scoreTone(69)).toBe("mid");
    expect(scoreTone(70)).toBe("high");
    expect(formatScore(null)).toBe("—");
    expect(formatScore(0)).toBe("0%");
    expect(formatScore(71.6)).toBe("72%");
  });

  it("names item statuses through i18n keys", () => {
    expect(itemStatusKey("ANSWERED")).toBe("presentation.statusAnswered");
    expect(itemStatusKey("whatever")).toBe("presentation.statusPending");
  });

  it("resolves task names from translation keys or falls back", () => {
    const mockT = (key: string) => (key === "tasks.READ_ALOUD" ? "Read Aloud (Đọc đoạn văn)" : key);
    expect(taskDisplayName("READ_ALOUD", "Read Aloud", mockT as never)).toBe("Read Aloud (Đọc đoạn văn)");
    expect(taskDisplayName("UNKNOWN_TASK", "Fallback Name", mockT as never)).toBe("Fallback Name");
    expect(taskDisplayName(null, "Fallback Name", mockT as never)).toBe("Fallback Name");
  });
});

describe("sessionDisplayName", () => {
  const base = { title: "PTE Core Practice", totalItemCount: 10, skillCode: null, taskCode: null };

  it("keeps a mock test title", () => {
    expect(sessionDisplayName({ ...base, kind: "MOCK_TEST", title: "PTE Academic Full Mock Test 1" }, taskName, t))
      .toBe("PTE Academic Full Mock Test 1");
  });

  it("names skill and task sessions with their question count", () => {
    expect(sessionDisplayName({ ...base, kind: "SKILL", skillCode: "READING" }, taskName, t)).toBe("Luyện Đọc · 10 câu");
    expect(sessionDisplayName({ ...base, kind: "TASK", taskCode: "READ_ALOUD" }, taskName, t)).toBe("Read Aloud · 10 câu");
  });

  it("reads a session from before kinds existed as a single task, or by its title", () => {
    expect(sessionDisplayName({ ...base, kind: null, taskCode: "READ_ALOUD" }, taskName, t)).toBe("Read Aloud · 10 câu");
    expect(sessionDisplayName({ ...base, kind: null }, taskName, t)).toBe("PTE Core Practice");
  });
});
