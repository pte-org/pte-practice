import { describe, expect, it } from "vitest";
import { fixtureForTask } from "../fixtures";
import { renderTask } from "./renderer-registry";
import type { TaskRendererProps } from "./RendererTypes";

const props: TaskRendererProps = {
  fixture: fixtureForTask("MC_READING_SINGLE"),
  rendererKey: "MC_READING_SINGLE_V1",
  value: {},
  onChange: () => undefined,
};

describe("practice renderer registry", () => {
  it("does not create interactive UI for unsupported media renderers", () => {
    expect(renderTask("MC_LISTENING_SINGLE_V1", {
      ...props,
      fixture: fixtureForTask("MC_LISTENING_SINGLE"),
      rendererKey: "MC_LISTENING_SINGLE_V1",
    })).toBeNull();
  });

  it("renders a registered client-supported renderer", () => {
    expect(renderTask("MC_READING_SINGLE_V1", props)).not.toBeNull();
  });
});
