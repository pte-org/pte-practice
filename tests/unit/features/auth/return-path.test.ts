import { describe, expect, it } from "vitest";
import { returnPath, signInHref } from "@/features/auth/return-path";

describe("return path after sign-in", () => {
  it("brings the student back to the page that asked for sign-in", () => {
    expect(signInHref("/study-pack")).toBe("/sign-in?next=%2Fstudy-pack");
    expect(returnPath("?next=%2Fstudy-pack")).toBe("/study-pack");
  });

  it("goes home when there is nothing or the home page to return to", () => {
    expect(signInHref("/")).toBe("/sign-in");
    expect(returnPath("")).toBe("/");
  });

  it("never follows another site or loops back to sign-in", () => {
    expect(returnPath("?next=https%3A%2F%2Fevil.test")).toBe("/");
    expect(returnPath("?next=%2F%2Fevil.test")).toBe("/");
    expect(returnPath("?next=%2F%5Cevil.test")).toBe("/");
    expect(returnPath("?next=%2Fsign-in")).toBe("/");
    expect(signInHref("//evil.test")).toBe("/sign-in");
  });
});
