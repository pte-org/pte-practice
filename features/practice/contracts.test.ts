import { describe, expect, it } from "vitest";
import {
  canStartPractice,
  normalizeCatalogResponse,
  normalizeEntitlementResponse,
  normalizePracticeProgressResponse,
  normalizePracticeSessionResponse,
  normalizeRecordingPlayback,
} from "./contracts";

describe("practice entitlement contract", () => {
  it("unlocks only when the server returns the exact UNLOCKED state", () => {
    const unlocked = normalizeEntitlementResponse({ practice: { state: "UNLOCKED" } });
    const unknown = normalizeEntitlementResponse({ practice: { state: "unexpected" } });

    expect(unlocked.practice.state).toBe("UNLOCKED");
    expect(unknown.practice.state).toBe("UNKNOWN");
    expect(canStartPractice(unlocked.practice.state, {
      availability: "RUNNABLE", rendererKey: "MC_READING_SINGLE_V1",
    })).toBe(true);
    expect(canStartPractice(unknown.practice.state, {
      availability: "RUNNABLE", rendererKey: "MC_READING_SINGLE_V1",
    })).toBe(false);
  });

  it("keeps locked when entitlement data is missing or malformed", () => {
    const entitlement = normalizeEntitlementResponse(null);

    expect(entitlement.practice.state).toBe("UNKNOWN");
    expect(canStartPractice(entitlement.practice.state, {
      availability: "RUNNABLE", rendererKey: "MC_READING_SINGLE_V1",
    })).toBe(false);
  });
});

describe("practice catalog contract", () => {
  it("normalizes server catalog metadata without exposing arbitrary renderer behavior", () => {
    const catalog = normalizeCatalogResponse({
      productCode: "PTE_CORE_PRACTICE",
      title: "PTE Core Practice",
      catalogVersion: "2026.10",
      timeLimitSeconds: 3600,
      sections: [{
        code: "READING",
        displayName: "Reading",
        taskTypes: [{
          code: "MC_READING_SINGLE",
          displayName: "Multiple choice",
          section: "READING",
          scored: true,
          availability: "RUNNABLE",
          rendererKey: "MC_READING_SINGLE_V1",
          requiredClientCapabilities: ["keyboard"],
        }],
      }],
    });

    expect(catalog?.sections[0]?.taskTypes[0]?.rendererKey).toBe("MC_READING_SINGLE_V1");
    expect(catalog?.sections[0]?.taskTypes[0]?.requiredClientCapabilities).toEqual(["keyboard"]);
  });

  it("rejects a catalog with no usable sections", () => {
    expect(normalizeCatalogResponse({ productCode: "PTE_CORE_PRACTICE", sections: [] })).toBeNull();
  });

  it("normalizes the server-owned current task without accepting an arbitrary renderer", () => {
    const session = normalizePracticeSessionResponse({
      publicId: "session-1",
      status: "IN_PROGRESS",
      currentTask: {
        publicId: "item-1",
        orderIndex: 0,
        taskCode: "MC_READING_SINGLE",
        displayName: "Multiple choice",
        section: "READING",
        rendererKey: "not-allowlisted",
        status: "PENDING",
        content: {
          promptText: "A practice prompt.",
          minWordCount: null,
          maxWordCount: null,
          options: [],
        },
      },
    });

    expect(session?.status).toBe("IN_PROGRESS");
    expect(session?.currentTask?.rendererKey).toBeNull();
    expect(session?.currentTask?.content?.promptText).toBe("A practice prompt.");
  });

  it("keeps progress history read-only and honest when score data is absent", () => {
    const progress = normalizePracticeProgressResponse({
      totalSessions: 1,
      completedSessions: 1,
      entries: [{
        sessionPublicId: "session-1",
        productCode: "PTE_CORE_PRACTICE",
        title: "PTE Core Practice",
        status: "COMPLETED_PENDING_SCORE",
        sessionStatus: "COMPLETED",
        answeredItemCount: 2,
        totalItemCount: 3,
        lowConfidenceCount: 1,
        mediumConfidenceCount: 1,
        highConfidenceCount: 0,
        score: null,
        hasMore: false,
      }],
    });

    expect(progress.entries[0]?.status).toBe("COMPLETED_PENDING_SCORE");
    expect(progress.entries[0]?.score).toBeNull();
    expect(progress.answeredItems).toBe(2);
    expect(progress.hasMore).toBe(false);
  });
});

describe("timed practice contract", () => {
  const baseSession = { publicId: "s-1", status: "IN_PROGRESS" };

  it("reads a session without a timing mode as untimed (sessions from before the choice existed)", () => {
    const session = normalizePracticeSessionResponse(baseSession);

    expect(session?.timingMode).toBe("UNTIMED");
    expect(session?.questionCount).toBeNull();
  });

  it("keeps TIMED and the question count", () => {
    const session = normalizePracticeSessionResponse({ ...baseSession, timingMode: "TIMED", questionCount: 10 });

    expect(session?.timingMode).toBe("TIMED");
    expect(session?.questionCount).toBe(10);
  });

  it("keeps the pinned per-item timing under the preRecordSeconds name", () => {
    const session = normalizePracticeSessionResponse({
      ...baseSession,
      currentTask: {
        publicId: "i-1", taskCode: "REPEAT_SENTENCE", status: "PENDING",
        timing: { preListenSeconds: 3, preRecordSeconds: 3, responseSeconds: 15 },
      },
    });

    expect(session?.currentTask?.timing).toEqual({ preListenSeconds: 3, preRecordSeconds: 3, responseSeconds: 15 });
  });

  it("leaves timing empty when the server sends none or an unusable value", () => {
    const none = normalizePracticeSessionResponse({ ...baseSession, currentTask: { publicId: "i-1", taskCode: "READ_ALOUD", status: "PENDING" } });
    const zero = normalizePracticeSessionResponse({
      ...baseSession,
      currentTask: { publicId: "i-1", taskCode: "READ_ALOUD", status: "PENDING", timing: { responseSeconds: 0 } },
    });

    expect(none?.currentTask?.timing).toBeNull();
    expect(zero?.currentTask?.timing).toBeNull();
  });

  it("defaults a catalog task to timed-unavailable when the server does not say", () => {
    const catalog = normalizeCatalogResponse({
      productCode: "PTE_CORE_PRACTICE",
      sections: [{ code: "SPEAKING", taskTypes: [
        { code: "READ_ALOUD", availability: "RUNNABLE" },
        { code: "REPEAT_SENTENCE", availability: "RUNNABLE", timedAvailable: true },
      ] }],
    });
    const [readAloud, repeat] = catalog?.sections[0]?.taskTypes ?? [];

    expect(readAloud?.timedAvailable).toBe(false);
    expect(repeat?.timedAvailable).toBe(true);
  });

  it("reads a playback link and rejects one without a url", () => {
    expect(normalizeRecordingPlayback({ url: "https://cdn/x.wav", expiresInSeconds: 900, durationSeconds: 7 }))
      .toEqual({ url: "https://cdn/x.wav", expiresInSeconds: 900, durationSeconds: 7 });
    expect(normalizeRecordingPlayback({ expiresInSeconds: 900 })).toBeNull();
  });
});
