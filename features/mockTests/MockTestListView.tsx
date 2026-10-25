"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppIcon, LoadingState, Modal, ProgressRing } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { AccessStatusBanner } from "@/features/practice/AccessStatusBanner";
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
  const { isPracticeUnlocked, authStatus } = usePractice();
  const api = useMemo(() => createPracticeApiClient(), []);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [confirmRestart, setConfirmRestart] = useState<MockTest | null>(null);
  const { openForMock, dialog } = usePracticeStart();

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    void api.listMockTests()
      .then((tests) => setState({ status: "ready", tests }))
      .catch(() => setState({ status: "error" }));
  }, [api, authStatus]);

  return (
    <div className="mock-tests">
      <AccessStatusBanner />
      {state.status === "loading" ? <LoadingState message={t("mockTests.loading")} /> : null}
      {state.status === "error" ? <p className="catalog-note" role="alert">{t("mockTests.loadError")}</p> : null}
      {state.status === "ready" && state.tests.length === 0
        ? <p className="catalog-note" role="status">{t("mockTests.empty")}</p> : null}
      {state.status === "ready" && state.tests.length > 0 ? (
        <ul className="mock-test-list">
          {state.tests.map((test) => {
            const action = mockTestAction(test);
            const attempt = test.latestAttempt;
            return (
              <li className="mock-test-row" key={test.publicId}>
                <span className={`mock-test-icon${action === "CONTINUE" ? " mock-test-icon-ring" : ""}`}>
                  {action === "CONTINUE" && attempt
                    ? <ProgressRing label={`${attempt.answeredItemCount}/${attempt.totalItemCount}`} variant="progress"
                        value={attempt.answeredItemCount} max={Math.max(1, attempt.totalItemCount)} size={44} />
                    : <AppIcon name="practice" size={22} />}
                </span>
                <span className="mock-test-copy">
                  <strong>{test.title}</strong>
                  <span className="mock-test-chips">
                    <span className="mock-test-chip"><AppIcon name="responses" size={14} /> {test.itemCount} {t("mockTests.questions")}</span>
                    <span className="mock-test-chip"><AppIcon name="timer" size={14} /> {formatEstimatedDuration(test.estimatedMinutes)}</span>
                    {action === "CONTINUE" && attempt
                      ? <span className="mock-test-chip">{attempt.answeredItemCount}/{attempt.totalItemCount}</span> : null}
                    {action === "RETAKE" && attempt?.estimatedOverall != null
                      ? <span className="mock-test-chip">{t("mockTests.estimatedScore")} {attempt.estimatedOverall}</span> : null}
                  </span>
                </span>
                {action === "CONTINUE"
                  ? <button className="text-button" type="button" disabled={!isPracticeUnlocked}
                      onClick={() => setConfirmRestart(test)}>{t("mockTests.startOver")}</button> : null}
                <button className="button button-primary button-pill" type="button" disabled={!isPracticeUnlocked}
                  onClick={() => (action === "CONTINUE"
                    ? router.push(practiceMockTestUrl(test.publicId))
                    : openForMock(mockTarget(test.publicId, test.title)))}>
                  <AppIcon name={action === "RETAKE" ? "retake" : "play"} size={16} />
                  {" "}{t(action === "CONTINUE" ? "mockTests.continue" : action === "RETAKE" ? "mockTests.retake" : "mockTests.start")}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      <Modal open={confirmRestart !== null} onClose={() => setConfirmRestart(null)} title={confirmRestart?.title}
        titleIcon={<AppIcon name="retake" size={22} />} closeLabel={t("mode.close")}
        footer={(
          <>
            <button className="text-button" type="button" onClick={() => setConfirmRestart(null)}>{t("mode.close")}</button>
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
