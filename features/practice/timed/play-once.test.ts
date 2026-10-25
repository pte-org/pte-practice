import { describe, expect, it } from "vitest";
import { createOnceCommand, createPlayOnceGuard } from "./play-once";

describe("play-once guard", () => {
  it("still allows an attempt until play() has resolved", () => {
    const guard = createPlayOnceGuard();
    expect(guard.canAttempt()).toBe(true);
    expect(guard.hasPlayed()).toBe(false);
  });

  it("counts a play once even when it is marked twice", () => {
    const guard = createPlayOnceGuard();
    guard.markPlayed();
    guard.markPlayed();
    expect(guard.hasPlayed()).toBe(true);
    expect(guard.canAttempt()).toBe(false);
  });

  it("counts a load error, a refetch and a successful play as one play", () => {
    const guard = createPlayOnceGuard();
    // first attempt fails to load: nothing is marked, so the retry with a fresh link is allowed
    expect(guard.canAttempt()).toBe(true);
    expect(guard.canAttempt()).toBe(true);
    guard.markPlayed();
    expect(guard.canAttempt()).toBe(false);
  });

  it("can be reset when the question is retried", () => {
    const guard = createPlayOnceGuard();
    guard.markPlayed();
    guard.reset();
    expect(guard.canAttempt()).toBe(true);
  });
});

describe("once command", () => {
  it("fires once however many times an effect runs", () => {
    const command = createOnceCommand();
    expect([command.fire(), command.fire(), command.fire()]).toEqual([true, false, false]);
  });

  it("fires again after a reset", () => {
    const command = createOnceCommand();
    command.fire();
    command.reset();
    expect(command.fire()).toBe(true);
  });
});
