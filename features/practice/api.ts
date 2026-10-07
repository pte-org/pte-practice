import { API_ERROR_TEXT, API_PATHS } from "./constants";
import type { PracticeCatalog, PracticeChallenge, PracticeEntitlement, PracticeSessionTokens } from "./contracts";
import { normalizeCatalogResponse, normalizeEntitlementResponse } from "./contracts";
import { clearPracticeSession, getPracticeSession, savePracticeSession } from "./session-storage";

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

export function createPracticeApiClient() {
  return {
    requestChallenge: (email: string) => request<PracticeChallenge>(API_PATHS.requestChallenge, {
      method: "POST",
      body: { email },
      allowRefresh: false,
    }),
    verifyChallenge: (body: { challengeId: string; email: string; code: string }) =>
      request<PracticeSessionTokens>(API_PATHS.verifyChallenge, {
        method: "POST",
        body,
        allowRefresh: false,
      }),
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
  };
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
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
    const refreshed = await refreshSession(session.refreshToken);
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
