import { API_PATHS } from "./constants";
import type { PracticeItemResult } from "./contracts";
import { normalizePracticeItemResult } from "./session-contracts";
import { normalizeRubric, type PracticeRubric } from "./rubric-contracts";

type PracticeRequest = <T>(path: string, options?: { method?: string; headers?: Record<string, string> }) => Promise<T>;

/** What pressing "Chấm điểm" on a finished mock test started. */
export interface MockTestScoringStart {
  queuedCount: number;
  scoringCount: number;
}

/** The "Chấm điểm" calls: one answer of a task or skill session, or every unscored answer of a finished mock test. */
export function scoringRequests(request: PracticeRequest, invalid: (code: string) => Error) {
  return {
    requestScoring: async (sessionPublicId: string, itemPublicId: string): Promise<PracticeItemResult> => {
      const result = normalizePracticeItemResult(await request<unknown>(
        `${API_PATHS.practiceSessions}/${sessionPublicId}/items/${itemPublicId}/scoring`, { method: "POST" }));
      if (!result) throw invalid("INVALID_ITEM_RESULT");
      return result;
    },
    /** A short-lived playback link for the student's own recorded answer. */
    getRecordingUrl: async (mediaPublicId: string): Promise<string | null> => {
      const response = await request<{ url?: unknown }>(`${API_PATHS.mediaObjects}/${mediaPublicId}/preview-url`);
      return typeof response?.url === "string" ? response.url : null;
    },
    /** The criteria (traits and level descriptions) a task type is scored against; empty for objective tasks. */
    getRubric: async (taskType: string): Promise<PracticeRubric> => normalizeRubric(
      await request<unknown>(`${API_PATHS.catalog}/rubrics/${encodeURIComponent(taskType)}`)),
    requestMockTestScoring: async (sessionPublicId: string): Promise<MockTestScoringStart> => {
      const response = await request<{ queuedCount?: unknown; scoringCount?: unknown }>(
        `${API_PATHS.practiceSessions}/${sessionPublicId}/scoring`, { method: "POST" });
      return {
        queuedCount: typeof response?.queuedCount === "number" ? response.queuedCount : 0,
        scoringCount: typeof response?.scoringCount === "number" ? response.scoringCount : 0,
      };
    },
  };
}
