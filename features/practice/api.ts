import { API_ERROR_TEXT, API_PATHS } from "./constants";
import type {
  PracticeCatalog,
  PracticeEntitlement,
  PracticeItemResult,
  PracticeReview,
  PracticeProgress,
  PracticeRecordingPlayback,
  StartSessionRequest,
  PracticeSession,
  PracticeSessionTokens,
} from "./contracts";
import { normalizeMockTests, type MockTest } from "../mockTests/mock-test-contracts";
import { normalizeReview } from "./review-contracts";
import type { PracticeAudioUploadGrant } from "./media/contracts";
import {
  normalizeCatalogResponse,
  normalizeEntitlementResponse,
  normalizePracticeItemResult,
  normalizePracticeProgressResponse,
  normalizePracticeSessionResponse,
  normalizeRecordingPlayback,
} from "./contracts";
import { clearPracticeSession, getPracticeSession, savePracticeSession } from "./session-storage";
import { refreshOnce } from "./token-refresh";

export class PracticeApiError extends Error {
  constructor(
    message: string,
    public readonly status = 0,
    public readonly code: string | null = null,
  ) {
    super(message);
    this.name = "PracticeApiError";
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  allowRefresh?: boolean;
}

const request = practiceRequest;

export function createPracticeApiClient() {
  return {
    // The roster account an organization issued; no session exists yet, so a 401 is a bad password, not a stale token.
    login: (body: { username: string; password: string }) =>
      request<PracticeSessionTokens>(API_PATHS.login, {
        method: "POST",
        body,
        allowRefresh: false,
      }),
    changePassword: (body: { currentPassword: string; newPassword: string }): Promise<void> =>
      request<void>(API_PATHS.changePassword, { method: "POST", body }).then(() => undefined),
    getEntitlement: async (): Promise<PracticeEntitlement> => {
      const response = await request<unknown>(API_PATHS.entitlement);
      return normalizeEntitlementResponse(response);
    },
    getCatalog: async (): Promise<PracticeCatalog> => {
      const response = await request<unknown>(API_PATHS.catalog);
      const catalog = normalizeCatalogResponse(response);
      if (!catalog) throw new PracticeApiError(API_ERROR_TEXT.invalidCatalog, 502, "INVALID_CATALOG");
      return catalog;
    },
    listMockTests: async (): Promise<MockTest[]> => normalizeMockTests(await request<unknown>(API_PATHS.mockTests)),
    getProgress: async (): Promise<PracticeProgress> => {
      const response = await request<unknown>(API_PATHS.progress);
      return normalizePracticeProgressResponse(response);
    },
    startSession: async (body: StartSessionRequest, idempotencyKey = createPracticeIdempotencyKey("start")): Promise<PracticeSession> =>
      sessionMutation(API_PATHS.practiceSessions, "POST", body, idempotencyKey),
    getSession: async (publicId: string): Promise<PracticeSession> => {
      const response = await request<unknown>(`${API_PATHS.practiceSessions}/${publicId}`);
      return requireSession(response);
    },
    beginSession: async (publicId: string, clientVersion: number,
      idempotencyKey = createPracticeIdempotencyKey("begin")): Promise<PracticeSession> =>
      sessionMutation(`${API_PATHS.practiceSessions}/${publicId}/begin`, "POST", { clientVersion }, idempotencyKey),
    heartbeat: async (publicId: string, clientVersion: number,
      idempotencyKey = createPracticeIdempotencyKey("heartbeat")): Promise<PracticeSession> =>
      sessionMutation(`${API_PATHS.practiceSessions}/${publicId}/heartbeat`, "POST", { clientVersion }, idempotencyKey),
    answer: async (publicId: string, itemPublicId: string, body: {
      clientVersion: number;
      payload: string;
      /** Practice no longer asks for confidence; always null. */
      confidence: null;
    }, idempotencyKey = createPracticeIdempotencyKey("answer")): Promise<PracticeSession> =>
      sessionMutation(`${API_PATHS.practiceSessions}/${publicId}/items/${itemPublicId}/answer`, "POST", body, idempotencyKey),
    /** Saves the current item without leaving the session (a finished or re-done recording). */
    saveDraft: async (publicId: string, itemPublicId: string, body: {
      clientVersion: number;
      payload: string;
      confidence: "LOW" | "MEDIUM" | "HIGH" | null;
    }, idempotencyKey = createPracticeIdempotencyKey("draft")): Promise<PracticeSession> =>
      sessionMutation(`${API_PATHS.practiceSessions}/${publicId}/items/${itemPublicId}/draft`, "POST", body, idempotencyKey),
    /** Short-lived link to the student's own saved recording, for replay and waveform after a reload. */
    getRecordingPlayback: async (publicId: string, itemPublicId: string): Promise<PracticeRecordingPlayback> => {
      const response = await request<unknown>(`${API_PATHS.practiceSessions}/${publicId}/items/${itemPublicId}/recording`);
      const playback = normalizeRecordingPlayback(response);
      if (!playback) throw new PracticeApiError(API_ERROR_TEXT.invalidSession, 502, "INVALID_PLAYBACK");
      return playback;
    },
    skip: async (publicId: string, itemPublicId: string, clientVersion: number,
      idempotencyKey = createPracticeIdempotencyKey("skip")): Promise<PracticeSession> =>
      sessionMutation(`${API_PATHS.practiceSessions}/${publicId}/items/${itemPublicId}/skip`, "POST", { clientVersion }, idempotencyKey),
    saveAndExit: async (publicId: string, clientVersion: number, draft?: {
      itemPublicId: string;
      payload: string;
      confidence: "LOW" | "MEDIUM" | "HIGH" | null;
      },
      idempotencyKey = createPracticeIdempotencyKey("exit")): Promise<PracticeSession> =>
      sessionMutation(`${API_PATHS.practiceSessions}/${publicId}/save-and-exit`, "POST", {
        clientVersion,
        ...(draft ?? {}),
      }, idempotencyKey),
    getItemResult: async (sessionPublicId: string, itemPublicId: string): Promise<PracticeItemResult> =>
      requireItemResult(await request<unknown>(
        `${API_PATHS.practiceSessions}/${sessionPublicId}/items/${itemPublicId}/result`)),
    retryScoring: async (sessionPublicId: string, itemPublicId: string,
      idempotencyKey = createPracticeIdempotencyKey("retry-scoring")): Promise<PracticeItemResult> =>
      requireItemResult(await request<unknown>(
        `${API_PATHS.practiceSessions}/${sessionPublicId}/items/${itemPublicId}/scoring/retry`,
        { method: "POST", headers: { "Idempotency-Key": idempotencyKey } })),
    getReview: async (sessionPublicId: string): Promise<PracticeReview> =>
      normalizeReview(await request<unknown>(`${API_PATHS.practiceSessions}/${sessionPublicId}/review`), sessionPublicId),
    requestResponseAudio: (body: {
      contentType: "audio/wav";
      assetKind: "STUDENT_RESPONSE_AUDIO";
      sizeBytes: number;
      practiceSessionId: string;
      practiceItemId: string;
      purpose: "PRACTICE_RESPONSE_AUDIO";
    }): Promise<PracticeAudioUploadGrant> => request<PracticeAudioUploadGrant>(API_PATHS.mediaObjects, {
      method: "POST",
      body,
    }),
    completeResponseAudio: (mediaPublicId: string, body: {
      publicId: string;
      assetId: string;
      secureUrl: string;
      resourceType: string;
      format?: string;
      bytes: number;
      durationSeconds: number;
      version: number;
      signature: string;
    }): Promise<void> => request<void>(`${API_PATHS.mediaObjects}/${mediaPublicId}/complete`, {
      method: "POST",
      body,
    }).then(() => undefined),
  };
}

export type PracticeApiClient = ReturnType<typeof createPracticeApiClient>;

async function sessionMutation<TBody>(path: string, method: "POST", body: TBody,
  idempotencyKey: string): Promise<PracticeSession> {
  const response = await request<unknown>(path, {
    method,
    body,
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return requireSession(response);
}

function requireItemResult(value: unknown): PracticeItemResult {
  const result = normalizePracticeItemResult(value);
  if (!result) throw new PracticeApiError(API_ERROR_TEXT.invalidSession, 502, "INVALID_ITEM_RESULT");
  return result;
}

function requireSession(value: unknown): PracticeSession {
  const session = normalizePracticeSessionResponse(value);
  if (!session) throw new PracticeApiError(API_ERROR_TEXT.invalidSession, 502, "INVALID_SESSION");
  return session;
}

export function createPracticeIdempotencyKey(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function practiceRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { allowRefresh = true, body, headers: customHeaders, ...requestInit } = options;
  const session = getPracticeSession();
  const headers = new Headers(customHeaders);
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (session?.accessToken) headers.set("Authorization", `Bearer ${session.accessToken}`);

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...requestInit,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new PracticeApiError(API_ERROR_TEXT.network, 0, "NETWORK_ERROR");
  }

  if (response.status === 401 && allowRefresh && session?.refreshToken) {
    // Another request may already have refreshed while this one was in flight: retry with the new token.
    if (getPracticeSession()?.accessToken !== session.accessToken) return request<T>(path, { ...options, allowRefresh: false });
    const refreshed = await refreshOnce(session.refreshToken, refreshSession);
    if (refreshed) return request<T>(path, { ...options, allowRefresh: false });
    clearPracticeSession();
  }

  const bodyValue = await parseJson(response);
  if (!response.ok) {
    const errorRecord = asRecord(bodyValue);
    throw new PracticeApiError(
      typeof errorRecord.userMessage === "string"
        ? errorRecord.userMessage
        : API_ERROR_TEXT.requestFailed,
      response.status,
      typeof errorRecord.code === "string" ? errorRecord.code : null,
    );
  }

  return unwrap<T>(bodyValue);
}

async function refreshSession(refreshToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${getApiBaseUrl()}${API_PATHS.refreshToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return false;
    const value = unwrap<PracticeSessionTokens>(await parseJson(response));
    if (!value.accessToken || !value.refreshToken) return false;
    savePracticeSession(value);
    return true;
  } catch {
    return false;
  }
}

export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function unwrap<T>(value: unknown): T {
  if (isRecord(value) && typeof value.success === "boolean" && "data" in value) {
    if (!value.success) {
      throw new PracticeApiError(API_ERROR_TEXT.requestRejected, 400, asString(value.code));
    }
    return value.data as T;
  }
  return value as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
