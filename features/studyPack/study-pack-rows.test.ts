import { describe, expect, it } from "vitest";
import { studySkillRows, totalPracticeQuestions } from "./study-pack-rows";

const task = { code: "T", availability: "RUNNABLE", rendererKey: "READ_ALOUD_V1" };
const section = (code: string, total: number, answered: number, tasks: unknown[] = [task]) =>
  ({ code, displayName: code, taskTypes: tasks, practiceQuestionCount: total, answeredQuestionCount: answered }) as never;

describe("studySkillRows", () => {
  it("orders the skills Speaking, Writing, Reading, Listening and skips ones the catalog lacks", () => {
    const rows = studySkillRows([section("WRITING", 3, 0), section("SPEAKING", 3, 0), section("READING", 3, 0)], true);
    expect(rows.map((row) => row.code)).toEqual(["SPEAKING", "WRITING", "READING"]);
  });

  it("starts only when unlocked and the skill has questions and a runnable task type", () => {
    const sections = [section("READING", 5, 1), section("LISTENING", 0, 0), section("SPEAKING", 4, 0, [])];
    expect(studySkillRows(sections, true).map((row) => row.canStart)).toEqual([false, true, false]);
    expect(studySkillRows(sections, false)[0].canStart).toBe(false);
  });

  it("never reports more answered than there are questions (older revisions can still count)", () => {
    expect(studySkillRows([section("READING", 5, 9)], true)[0].answered).toBe(5);
  });

  it("sums the practice questions of all skills", () => {
    expect(totalPracticeQuestions(studySkillRows([section("READING", 5, 0), section("WRITING", 7, 0)], true))).toBe(12);
  });
});
