"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactElement } from "react";
import { ConfirmDialog, useToast } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import type { PracticeApiClient } from "../api";
import { reviewHref } from "../review-return";

interface FinishSessionButtonProps {
  api: PracticeApiClient;
  sessionId: string;
  answeredCount: number;
  totalCount: number;
  disabled: boolean;
  /** The page the session was started from, so its review returns there and the rail keeps lighting it. */
  reviewFrom: string;
}

/** "Nộp bài": ends the session after any number of answered questions and opens its review. */
export const FinishSessionButton = ({ api, sessionId, answeredCount, totalCount, disabled, reviewFrom }: FinishSessionButtonProps): ReactElement => {
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const finish = async (): Promise<void> => {
    setFinishing(true);
    const finished = await api.finishSession(sessionId).catch(() => false);
    setFinishing(false);
    setOpen(false);
    if (!finished) {
      showToast(t("session.finishError"), { tone: "warning" });
      return;
    }
    router.replace(reviewHref(sessionId, reviewFrom));
  };

  return (
    <>
      <button className="button button-primary button-pill session-finish-btn" type="button"
        disabled={disabled || answeredCount === 0} onClick={() => setOpen(true)}>
        {t("session.finish")}
      </button>
      <ConfirmDialog open={open} tone="accent" title={t("session.finishTitle")}
        description={t("session.finishDescription").replace("{answered}", String(answeredCount)).replace("{total}", String(totalCount))}
        confirmLabel={t("session.finish")} cancelLabel={t("session.cancel")} isConfirming={finishing}
        onClose={() => setOpen(false)} onConfirm={() => void finish()} />
    </>
  );
};
