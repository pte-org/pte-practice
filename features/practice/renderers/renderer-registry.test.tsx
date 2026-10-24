import { describe, expect, it } from "vitest";
import { fixtureForTask } from "../fixtures";
import { ALLOWED_RENDERER_KEYS, isClientRuntimeSupported } from "../renderer-allowlist";
import { PREVIEW_TASKS } from "../constants";
import { renderTask } from "./renderer-registry";
import type { TaskRendererProps } from "./RendererTypes";

const props: TaskRendererProps = {
  fixture: fixtureForTask("MC_READING_SINGLE"),
  rendererKey: "MC_READING_SINGLE_V1",
  value: {},
  onChange: () => undefined,
};

describe("practice renderer registry", () => {
  it("has a client renderer for every visible practice task type", () => {
    for (const task of PREVIEW_TASKS) {
      const key = `${task.code}_V1` as typeof ALLOWED_RENDERER_KEYS[number];
      expect(ALLOWED_RENDERER_KEYS, task.code).toContain(key);
      expect(isClientRuntimeSupported(key), task.code).toBe(true);
      expect(renderTask(key, { ...props, fixture: fixtureForTask(task.code), rendererKey: key }), task.code)
        .not.toBeNull();
    }
  });

  it("renders the listening choice renderer now that prompt audio is available", () => {
    expect(renderTask("MC_LISTENING_SINGLE_V1", {
      ...props,
      fixture: fixtureForTask("MC_LISTENING_SINGLE"),
      rendererKey: "MC_LISTENING_SINGLE_V1",
    })).not.toBeNull();
  });

  it("no longer knows the hidden or removed task types", () => {
    expect(ALLOWED_RENDERER_KEYS as readonly string[]).not.toContain("PERSONAL_INTRODUCTION_V1");
    expect(ALLOWED_RENDERER_KEYS as readonly string[]).not.toContain("WRITE_EMAIL_V1");
  });

  it("does not render a generic capability key as a task", () => {
    expect(renderTask("SELECT_OPTION", props)).toBeNull();
  });
});
