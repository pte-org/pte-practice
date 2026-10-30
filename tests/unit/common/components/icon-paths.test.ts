import { describe, expect, it } from "vitest";
import { ICON_PATHS, type IconName } from "@/common/components/icon-paths";

describe("ICON_PATHS", () => {
  const entries = Object.entries(ICON_PATHS) as Array<[IconName, string]>;

  it("gives every icon a non-empty Material Design path", () => {
    for (const [name, path] of entries) {
      expect(path, `${name} has no path`).toMatch(/^M/);
    }
  });

  it("covers the icons the recorder and timer need", () => {
    for (const name of ["record", "stop", "pause", "retake", "timer"] as const) {
      expect(ICON_PATHS[name]).toBeTruthy();
    }
  });
});
