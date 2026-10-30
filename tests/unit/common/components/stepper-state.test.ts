import { describe, expect, it } from "vitest";
import { stepStates } from "@/common/components/stepper-state";

const steps = [{ id: "listen", label: "Listen" }, { id: "prep", label: "Prepare" }, { id: "record", label: "Record" }];

describe("stepStates", () => {
  it("marks earlier steps done, the current one current and the rest upcoming", () => {
    expect(stepStates(steps, "prep")).toEqual(["done", "current", "upcoming"]);
  });

  it("starts with nothing done", () => {
    expect(stepStates(steps, "listen")).toEqual(["current", "upcoming", "upcoming"]);
  });

  it("marks everything upcoming for an unknown step", () => {
    expect(stepStates(steps, "missing")).toEqual(["upcoming", "upcoming", "upcoming"]);
  });
});
