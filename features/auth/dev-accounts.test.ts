import { describe, expect, it } from "vitest";
import { parseDevTestAccounts } from "./dev-accounts";

describe("parseDevTestAccounts", () => {
  it("reads account:password pairs separated by semicolons", () => {
    expect(parseDevTestAccounts("demo.hs1:Secret123; demo.hs2:Other456")).toEqual([
      { username: "demo.hs1", password: "Secret123" },
      { username: "demo.hs2", password: "Other456" },
    ]);
  });

  it("keeps colons that belong to the password", () => {
    expect(parseDevTestAccounts("demo.hs1:a:b")).toEqual([{ username: "demo.hs1", password: "a:b" }]);
  });

  it("ignores empty and malformed entries", () => {
    expect(parseDevTestAccounts("")).toEqual([]);
    expect(parseDevTestAccounts(";:nouser;nopassword:;justtext")).toEqual([]);
  });
});
