import { describe, expect, it } from "vitest";
import {
  canStartPractice,
  normalizeCatalogResponse,
  normalizeEntitlementResponse,
  normalizePracticeProgressResponse,
  normalizePracticeSessionResponse,
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
      },
    });

    expect(session?.status).toBe("IN_PROGRESS");
    expect(session?.currentTask?.rendererKey).toBeNull();
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
