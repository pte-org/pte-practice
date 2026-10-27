import { describe, expect, it } from "vitest";
import { createLatestGate } from "./latest-request";

describe("createLatestGate", () => {
  it("only the newest load is current", () => {
    const gate = createLatestGate();
    const first = gate.begin();
    const second = gate.begin();
    expect(gate.isLatest(first)).toBe(false);
    expect(gate.isLatest(second)).toBe(true);
  });

  it("cancel invalidates the newest load until another begins", () => {
    const gate = createLatestGate();
    const id = gate.begin();
    gate.cancel();
    expect(gate.isLatest(id)).toBe(false);
    expect(gate.isLatest(gate.begin())).toBe(true);
  });
});
