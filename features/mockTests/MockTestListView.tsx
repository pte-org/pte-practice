"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppIcon, LoadingState, Modal, ProgressRing, useToast } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { createPracticeApiClient } from "@/features/practice/api";
import { mockTarget } from "@/features/practice/mode/mode-target";
import { practiceMockTestUrl } from "@/features/practice/mode/practice-url";
import { usePracticeStart } from "@/features/practice/mode/usePracticeStart";
import { usePractice } from "@/features/practice/PracticeProvider";
import type { MockTest } from "./mock-test-contracts";
import { formatEstimatedDuration, mockTestAction } from "./mock-test-row";

type LoadState = { status: "loading" } | { status: "error" } | { status: "ready"; tests: MockTest[] };

export function MockTestListView() {
  const router = useRouter();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { isPracticeUnlocked, authStatus } = usePractice();
  const api = useMemo(() => createPracticeApiClient(), []);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [confirmRestart, setConfirmRestart] = useState<MockTest | null>(null);
  const { openForMock, dialog } = usePracticeStart();

  const fetchTests = useCallback((showErrorToast = true) => {
    if (authStatus !== "authenticated") return undefined;
    let active = true;
    api.listMockTests()
      .then((tests) => {
        if (active) setState({ status: "ready", tests });
      })
      .catch(() => {
        if (active) {
          setState({ status: "error" });
          if (showErrorToast) {
            showToast(t("mockTests.loadError"), { tone: "error" });
          }
        }
      });
    return () => {
      active = false;
    };
  }, [api, authStatus, showToast, t]);

  useEffect(() => {
    return fetchTests(true);
  }, [fetchTests]);

  const handleRetry = () => {
    setState({ status: "loading" });
    fetchTests(true);
  };

  return (
    <div className="mock-tests">
      {state.status === "loading" ? <LoadingState message={t("mockTests.loading")} /> : null}
      {state.status === "error" ? (
        <div className="catalog-note" role="alert" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span>{t("mockTests.loadError")}</span>
          <button className="text-button" type="button" onClick={handleRetry}>
            {t("common.tryAgain")}
          </button>
        </div>
      ) : null}
      {state.status === "ready" && state.tests.length === 0
        ? <p className="card catalog-note" role="status">{t("mockTests.emptyBank")}</p> : null}
      {state.status === "ready" && state.tests.length > 0 ? (
        <ul className="mock-test-list">
          {state.tests.map((test) => {
            const action = mockTestAction(test);
            const attempt = test.latestAttempt;
            return (
              <li className="card mock-test-row" key={test.publicId}>
                <span className={`mock-test-icon${action === "CONTINUE" ? " mock-test-icon-ring" : ""}`}>
                  {action === "CONTINUE" && attempt
                    ? <ProgressRing label={`${attempt.answeredItemCount}/${attempt.totalItemCount}`} variant="progress"
                        value={attempt.answeredItemCount} max={Math.max(1, attempt.totalItemCount)} size={44} />
                    : <AppIcon name="practice" size={22} />}
                </span>
                <span className="mock-test-copy">
                  <strong>{test.title}</strong>
                  <span className="mock-test-chips">
                    <span className="chip"><AppIcon name="responses" size={14} /> {test.itemCount} {t("mockTests.questions")}</span>
                    <span className="chip"><AppIcon name="timer" size={14} /> {formatEstimatedDuration(test.estimatedMinutes)}</span>
                    {action === "CONTINUE" && attempt
                      ? <span className="chip">{attempt.answeredItemCount}/{attempt.totalItemCount}</span> : null}
                    {action === "RETAKE" && attempt?.estimatedOverall != null
                      ? <span className="chip">{t("mockTests.estimatedScore")} {attempt.estimatedOverall}</span> : null}
                  </span>
                </span>
                <div className="skill-task-actions">
                  {action === "CONTINUE" ? (
                    <>
                      <button
                        className="button button-outline button-pill"
                        type="button"
                        disabled={!isPracticeUnlocked}
                        onClick={() => router.push(practiceMockTestUrl(test.publicId))}
                      >
                        <AppIcon name="play" size={16} />
                        {" "}{t("mockTests.continue")}
                      </button>
                      <button
                        className="button button-ghost button-pill"
                        type="button"
                        disabled={!isPracticeUnlocked}
                        onClick={() => setConfirmRestart(test)}
                      >
                        {t("mockTests.startOver")}
                      </button>
                    </>
                  ) : (
                    <button
                      className="button button-outline button-pill"
                      type="button"
                      disabled={!isPracticeUnlocked}
                      onClick={() => openForMock(mockTarget(test.publicId, test.title))}
                    >
                      <AppIcon name={action === "RETAKE" ? "retake" : "play"} size={16} />
                      {" "}{t(action === "RETAKE" ? "mockTests.retake" : "mockTests.start")}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
      <Modal open={confirmRestart !== null} onClose={() => setConfirmRestart(null)} title={confirmRestart?.title}
        titleIcon={<AppIcon name="retake" size={22} />} closeLabel={t("mode.close")}
        footer={(
          <>
            <button
              className="button button-pill button-outline-danger"
              type="button"
              onClick={() => setConfirmRestart(null)}
            >
              {t("mode.close")}
            </button>
            <button className="button button-primary button-pill" type="button" onClick={() => {
              if (confirmRestart) openForMock(mockTarget(confirmRestart.publicId, confirmRestart.title, true));
              setConfirmRestart(null);
            }}>{t("mockTests.startOver")}</button>
          </>
        )}>
        <p>{t("mockTests.startOverWarning")}</p>
      </Modal>
      {dialog}
    </div>
  );
}
