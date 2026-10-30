import { describe, expect, it } from "vitest";
import { latestSessionRing, skillReadiness } from "@/features/practice/progress-rings";

const task = (availability: "RUNNABLE" | "VISIBLE") => ({ availability, rendererKey: "READ_ALOUD_V1" }) as never;

describe("skillReadiness", () => {
  it("counts the task types that can be started", () => {
    const section = { code: "SPEAKING", taskTypes: [task("RUNNABLE"), task("VISIBLE"), task("RUNNABLE")] } as never;
    expect(skillReadiness(section, true)).toEqual({ ready: 2, total: 3 });
  });

  it("reports nothing ready while practice is locked, and handles a missing skill", () => {
    const section = { code: "SPEAKING", taskTypes: [task("RUNNABLE")] } as never;
    expect(skillReadiness(section, false)).toEqual({ ready: 0, total: 1 });
    expect(skillReadiness(undefined, true)).toEqual({ ready: 0, total: 0 });
  });
});

describe("latestSessionRing", () => {
  it("fills with answered over total, and stays empty without a session", () => {
    expect(latestSessionRing({ answeredItemCount: 3, totalItemCount: 10 })).toEqual({ variant: "progress", value: 3, max: 10 });
    expect(latestSessionRing(null).variant).toBe("empty");
    expect(latestSessionRing({ answeredItemCount: 0, totalItemCount: 0 }).variant).toBe("empty");
  });
});
