"use client";

import type { ReactElement } from "react";
import { Skeleton } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { PracticeFrame } from "./PracticeFrame";

export const SessionSkeleton = (): ReactElement => {
  const { t } = useTranslation();
  return (
    <PracticeFrame loading label={t("ui.sessionLoading")}
      header={<div className="practice-skeleton-header"><Skeleton variant="title" /><Skeleton variant="button" /></div>}
      sidebar={<div className="practice-skeleton-card"><Skeleton variant="circle" /><Skeleton variant="title" /><Skeleton /><Skeleton /><Skeleton variant="block" /></div>}
      footer={<Skeleton variant="button" />}>
      <span className="common-loading-label" role="status">{t("ui.sessionLoading")}</span>
      <div className="practice-skeleton-card"><Skeleton variant="title" /><Skeleton /><Skeleton /><Skeleton variant="block" /><Skeleton variant="button" /></div>
    </PracticeFrame>
  );
};
