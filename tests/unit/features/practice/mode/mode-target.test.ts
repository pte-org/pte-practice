import { describe, expect, it } from "vitest";
import { preferenceKey, runnableTasks, skillTarget, taskTarget } from "@/features/practice/mode/mode-target";

const task = (code: string, availability: "RUNNABLE" | "VISIBLE", timedAvailable: boolean) =>
  ({ code, displayName: code, availability, rendererKey: "READ_ALOUD_V1", timedAvailable }) as never;

describe("mode targets", () => {
  it("describes a task type from the catalog", () => {
    expect(taskTarget(task("READ_ALOUD", "RUNNABLE", true)))
      .toEqual({ kind: "task", code: "READ_ALOUD", title: "READ_ALOUD", timedAvailable: true });
  });

  it("offers a skill as timed only when every runnable task type can be timed", () => {
    const allTimed = { code: "SPEAKING", taskTypes: [task("A", "RUNNABLE", true), task("B", "RUNNABLE", true)] } as never;
    const oneNot = { code: "SPEAKING", taskTypes: [task("A", "RUNNABLE", true), task("B", "RUNNABLE", false)] } as never;
    expect(skillTarget(allTimed, "Speaking").timedAvailable).toBe(true);
    expect(skillTarget(oneNot, "Speaking").timedAvailable).toBe(false);
  });

  it("ignores task types that cannot start and reports no timing for an empty skill", () => {
    const section = { code: "WRITING", taskTypes: [task("A", "VISIBLE", false), task("B", "RUNNABLE", true)] } as never;
    expect(runnableTasks(section).map((item) => item.code)).toEqual(["B"]);
    expect(skillTarget({ code: "WRITING", taskTypes: [task("A", "VISIBLE", true)] } as never, "Writing").timedAvailable)
      .toBe(false);
  });

  it("keeps skill and task preferences apart", () => {
    expect(preferenceKey({ kind: "skill", code: "READING" })).toBe("skill:READING");
    expect(preferenceKey({ kind: "task", code: "READ_ALOUD" })).toBe("READ_ALOUD");
  });
});
