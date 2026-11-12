"use client";

import { useEffect, useRef, type ReactElement } from "react";
import { useTranslation } from "@/common/i18n";
import type { PracticeReviewItem } from "../contracts";

interface ReviewPagerProps {
  items: readonly PracticeReviewItem[];
  index: number;
  onSelect: (index: number) => void;
}

const chipTone = (item: PracticeReviewItem): string => {
  if (item.score !== null && Number.isFinite(item.score)) return "scored";
  return item.status === "ANSWERED" ? "answered" : "empty";
};

/** Numbered question chips, coloured by scored / answered / empty. */
export const ReviewQuestionNav = ({ items, index, onSelect }: ReviewPagerProps): ReactElement => {
  const { t } = useTranslation();
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    navRef.current?.querySelector<HTMLElement>("[aria-current]")?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [index]);
  return (
    <nav ref={navRef} className="review-question-nav" aria-label={t("review.questionNav")}>
      {items.map((item, position) => (
        <button key={item.publicId} type="button" onClick={() => onSelect(position)}
          className={`review-chip review-chip-${chipTone(item)}${position === index ? " review-chip-active" : ""}`}
          aria-current={position === index ? "step" : undefined} title={item.displayName}>
          {item.orderIndex + 1}
        </button>
      ))}
    </nav>
  );
};

/** Previous / position / next under the panels. */
export const ReviewPager = ({ items, index, onSelect }: ReviewPagerProps): ReactElement => {
  const { t } = useTranslation();
  return (
    <div className="review-pager">
      <button type="button" className="button button-outline button-pill" disabled={index === 0}
        onClick={() => onSelect(index - 1)}>{t("presentation.previous")}</button>
      <span>{t("review.pagerPosition").replace("{n}", String(index + 1)).replace("{total}", String(items.length))}</span>
      <button type="button" className="button button-outline button-pill" disabled={index >= items.length - 1}
        onClick={() => onSelect(index + 1)}>{t("presentation.next")}</button>
    </div>
  );
};
