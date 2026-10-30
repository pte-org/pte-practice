import { describe, expect, it } from "vitest";
import {
  DEFAULT_MODE_PREFERENCE, parseModePreference, readModePreference, writeModePreference, type PreferenceStorage,
} from "@/features/practice/mode/mode-preference";

function fakeStorage(initial: Record<string, string> = {}): PreferenceStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return { data, getItem: (key) => data[key] ?? null, setItem: (key, value) => { data[key] = value; } };
}

describe("parseModePreference", () => {
  it("defaults to untimed with ten questions when nothing is stored", () => {
    expect(parseModePreference(null)).toEqual({ timingMode: "UNTIMED", questionCount: 10 });
  });

  it("keeps a valid stored choice", () => {
    expect(parseModePreference('{"timingMode":"TIMED","questionCount":5}')).toEqual({ timingMode: "TIMED", questionCount: 5 });
    expect(parseModePreference('{"timingMode":"UNTIMED","questionCount":50}')).toEqual({ timingMode: "UNTIMED", questionCount: 50 });
  });

  it("ignores a corrupt or unknown value field by field", () => {
    expect(parseModePreference("not json")).toEqual(DEFAULT_MODE_PREFERENCE);
    expect(parseModePreference('{"timingMode":"FAST","questionCount":7}')).toEqual(DEFAULT_MODE_PREFERENCE);
    expect(parseModePreference('{"timingMode":"TIMED","questionCount":"10"}')).toEqual({ timingMode: "TIMED", questionCount: 10 });
    expect(parseModePreference("42")).toEqual(DEFAULT_MODE_PREFERENCE);
  });
});

describe("read and write", () => {
  it("remembers the choice per task type", () => {
    const storage = fakeStorage();
    writeModePreference("READ_ALOUD", { timingMode: "TIMED", questionCount: 5 }, storage);
    writeModePreference("WRITE_ESSAY", { timingMode: "UNTIMED", questionCount: 50 }, storage);

    expect(readModePreference("READ_ALOUD", storage)).toEqual({ timingMode: "TIMED", questionCount: 5 });
    expect(readModePreference("WRITE_ESSAY", storage)).toEqual({ timingMode: "UNTIMED", questionCount: 50 });
    expect(readModePreference("REPEAT_SENTENCE", storage)).toEqual(DEFAULT_MODE_PREFERENCE);
  });

  it("falls back to the default when storage is missing or throws", () => {
    const throwing: PreferenceStorage = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
    };

    expect(readModePreference("READ_ALOUD", null)).toEqual(DEFAULT_MODE_PREFERENCE);
    expect(readModePreference("READ_ALOUD", throwing)).toEqual(DEFAULT_MODE_PREFERENCE);
    expect(() => writeModePreference("READ_ALOUD", DEFAULT_MODE_PREFERENCE, throwing)).not.toThrow();
    expect(() => writeModePreference("READ_ALOUD", DEFAULT_MODE_PREFERENCE, null)).not.toThrow();
  });
});
