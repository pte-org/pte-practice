import { describe, expect, it } from "vitest";
import { footerDisabled, type FooterDisabledInput } from "@/features/practice/session/footer-actions";

describe("footer disabled flags", () => {
  const free: FooterDisabledInput = { locked: false, unsupported: false, audioUnavailable: false, recorderBusy: false };

  it("locks nothing for an ordinary question", () => {
    expect(footerDisabled(free)).toEqual({ prev: false, skip: false, submit: false, next: false });
  });

  it("keeps Next usable on an unsupported question, so a learner who stepped back to one can move on", () => {
    const flags = footerDisabled({ ...free, unsupported: true });
    expect(flags.next).toBe(false);
    expect(flags.prev).toBe(false);
    expect(flags.submit).toBe(true);
  });

  it("locks only Submit when the prompt audio is missing", () => {
    expect(footerDisabled({ ...free, audioUnavailable: true })).toEqual({ prev: false, skip: false, submit: true, next: false });
  });

  it("locks every button while a command runs or a recording is busy", () => {
    const all = { prev: true, skip: true, submit: true, next: true };
    expect(footerDisabled({ ...free, locked: true })).toEqual(all);
    expect(footerDisabled({ ...free, recorderBusy: true })).toEqual(all);
  });

  it("honours the extra locks from the session page", () => {
    expect(footerDisabled({ ...free, prevDisabled: true }).prev).toBe(true);
    expect(footerDisabled({ ...free, submitDisabled: true }).submit).toBe(true);
    expect(footerDisabled({ ...free, nextDisabled: true }).next).toBe(true);
  });
});

