"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type Dispatch, useCallback, useEffect, useRef, useState } from "react";
import { createPracticeIdempotencyKey, PracticeApiError, type PracticeApiClient } from "../api";
import { PRACTICE_ROUTES } from "../constants";
import { canStartPractice, type PracticeSession } from "../contracts";
import { usePractice } from "../PracticeProvider";
import { DEFAULT_MODE_PREFERENCE, isQuestionCountOption } from "../mode/mode-preference";
import { runnableTasks } from "../mode/mode-target";
import type { PracticeSessionAction } from "../session-state";

const CLIENT_CAPABILITIES = [
  "OPTION_SELECTION",
  "HIGHLIGHT_SELECTION",
  "DRAG_AND_DROP",
  "DROPDOWN_SELECTION",
  "TEXT_INPUT",
  "AUDIO_PLAYBACK",
  "AUDIO_RECORDING",
  "IMAGE_DISPLAY",
];

interface UseSessionLifecycleOptions {
  api: PracticeApiClient;
  dispatch: Dispatch<PracticeSessionAction>;
  hydrateDraft: (session: PracticeSession) => void;
  /** Called when a different session is about to load, so the previous one's score and warnings do not leak. */
  onReset: () => void;
  errorMessage: (reason: unknown) => string;
  accessLockedMessage: string;
  unsupportedMessage: string;
}

/**
 * Loads the session this page is about: resumes `?sessionId=…`, or starts one for `?task=…`, `?skill=…` or
 * `?mockTest=…`. The view stays mounted across them, so each distinct request is initialised exactly once and a failed one can be reloaded.
 */
export function useSessionLifecycle(options: UseSessionLifecycleOptions): { reload: () => void } {
  const { api, dispatch, hydrateDraft, onReset, errorMessage, accessLockedMessage, unsupportedMessage } = options;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authStatus, entitlementStatus, catalogStatus, entitlement, catalog, isPracticeUnlocked } = usePractice();
  const [retryCount, setRetryCount] = useState(0);
  const initialized = useRef<string | null>(null);
  const startKey = useRef<{ request: string; key: string } | null>(null);
  const taskCode = searchParams.get("task");
  const skillCode = searchParams.get("skill");
  const mockTestId = searchParams.get("mockTest");
  const restartMockTest = searchParams.get("restart") === "1";
  const sessionId = searchParams.get("sessionId");
  const timingMode = searchParams.get("mode") === "TIMED" ? "TIMED" : DEFAULT_MODE_PREFERENCE.timingMode;
  const requestedCount = Number(searchParams.get("count"));
  const questionCount = isQuestionCountOption(requestedCount) ? requestedCount : DEFAULT_MODE_PREFERENCE.questionCount;
  const hasTarget = Boolean(taskCode || skillCode || mockTestId);
  const requestKey = sessionId ? `resume:${sessionId}`
    : mockTestId ? `mock:${mockTestId}|${restartMockTest}`
      : skillCode ? `skill:${skillCode}|${timingMode}|${questionCount}`
        : `task:${taskCode ?? "missing"}|${timingMode}|${questionCount}`;

  const loadSession = useCallback(async () => {
    if (sessionId) {
      return api.getSession(sessionId);
    }
    if (!hasTarget || !isPracticeUnlocked || !entitlement?.organizationContext) {
      throw new PracticeApiError(accessLockedMessage, 403, "PRACTICE_NOT_ENTITLED");
    }
    const base = {
      productCode: catalog.productCode,
      organizationId: entitlement.organizationContext.publicId,
      capabilities: { supportedCapabilities: CLIENT_CAPABILITIES, appVersion: "practice-web-2" },
    };
    // One key per request: a retry of the same request replays safely, a different one must not reuse the key (409).
    if (startKey.current?.request !== requestKey) {
      startKey.current = { request: requestKey, key: createPracticeIdempotencyKey("start") };
    }
    if (mockTestId) {
      // A mock test is always timed and has a fixed length, so only the restart choice travels.
      return api.startSession({ ...base, mockTestId, restart: restartMockTest || undefined }, startKey.current.key);
    }
    if (skillCode) {
      const section = catalog.sections.find((item) => item.code === skillCode);
      if (!section || runnableTasks(section).length === 0) {
        throw new PracticeApiError(unsupportedMessage, 422, "PRACTICE_CONTENT_NOT_READY");
      }
      return api.startSession({ ...base, skillCode, timingMode, questionCount }, startKey.current.key);
    }
    const task = catalog.sections.flatMap((section) => section.taskTypes).find((item) => item.code === taskCode);
    if (!task || !canStartPractice("UNLOCKED", task)) {
      throw new PracticeApiError(unsupportedMessage, 422, "PRACTICE_CONTENT_NOT_READY");
    }
    return api.startSession({ ...base, taskTypeCodes: [task.code], timingMode, questionCount }, startKey.current.key);
  }, [accessLockedMessage, api, catalog, entitlement, hasTarget, isPracticeUnlocked, mockTestId, questionCount,
    requestKey, restartMockTest, sessionId, skillCode, taskCode, timingMode, unsupportedMessage]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    if (!sessionId && (entitlementStatus !== "ready" || catalogStatus !== "ready")) return;
    if (!sessionId && !hasTarget) return;
    if (initialized.current === requestKey) return;
    initialized.current = requestKey;
    onReset();
    dispatch({ type: "loading" });
    void loadSession()
      .then((session) => {
        hydrateDraft(session);
        if (!sessionId) router.replace(`${PRACTICE_ROUTES.practiceSession}?sessionId=${session.publicId}`);
        dispatch({ type: "received", session });
      })
      .catch((reason: unknown) => dispatch({ type: "failed", message: errorMessage(reason) }));
  }, [authStatus, catalogStatus, dispatch, entitlementStatus, errorMessage, hydrateDraft, loadSession, onReset,
    hasTarget, requestKey, retryCount, router, sessionId]);

  const reload = useCallback(() => {
    initialized.current = null;
    dispatch({ type: "loading" });
    setRetryCount((value) => value + 1);
  }, [dispatch]);

  return { reload };
}
