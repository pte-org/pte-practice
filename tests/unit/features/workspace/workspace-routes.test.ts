import { describe, expect, it } from "vitest";
import { isWorkspaceRoute } from "@/features/workspace/constants";

describe("workspace route scope", () => {
  it.each(["/", "/practice-tests", "/study-pack", "/progress"])("shares overview chrome on %s", (path) => {
    expect(isWorkspaceRoute(path)).toBe(true);
  });
  it.each(["/practice-tests/session", "/practice-tests/session/review", "/sign-in", "/change-password", "/unknown"])(
    "keeps delivery, review and other screens outside the workspace: %s", (path) => {
      expect(isWorkspaceRoute(path)).toBe(false);
    },
  );
});
