"use client";

import Link from "next/link";
import { AppIcon, ProgressRing } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { formatEstimatedDuration } from "@/features/mockTests/mock-test-row";
import type { Recommendation } from "./recommendations";

interface RecommendationCarouselProps {
  cards: Recommendation[];
  /** Starts a mock test that has no attempt yet (opens the timed / untimed choice). */
  onStartMock: (publicId: string, title: string) => void;
}

/** "Recommended for you": a row of cards that scrolls sideways, the next card peeking in. */
export function RecommendationCarousel({ cards, onStartMock }: RecommendationCarouselProps) {
  const { t } = useTranslation();
  return (
    <div className="carousel" role="list">
      {cards.map((card) => (
        <article className="card recommendation-tile" role="listitem" key={card.id}>
          <div className="recommendation-tile-head">
            <ProgressRing label={`${card.progress.done}/${card.progress.total}`} variant={card.progress.done ? "progress" : "empty"}
              value={card.progress.done} max={Math.max(1, card.progress.total)} size={44}>
              <AppIcon name={card.target.type === "mock" || card.id.startsWith("mock:") ? "practice" : "reading"} size={18} />
            </ProgressRing>
            <div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          </div>
          <div className="recommendation-tile-foot">
            <span className="recommendation-tile-chips">
              {card.itemCount !== null ? <span className="chip"><AppIcon name="responses" size={14} /> {card.itemCount} {t("presentation.questions")}</span> : null}
              {card.minutes !== null ? <span className="chip"><AppIcon name="timer" size={14} /> {formatEstimatedDuration(card.minutes)}</span> : null}
            </span>
            {card.target.type === "href" ? (
              <Link className="button button-outline button-pill" href={card.target.href}>
                <AppIcon name="play" size={15} /> {t("presentation.continue")}
              </Link>
            ) : (
              <button className="button button-outline button-pill" type="button"
                onClick={() => card.target.type === "mock" && onStartMock(card.target.publicId, card.target.title)}>
                <AppIcon name="play" size={15} /> {t("presentation.startTest")}
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
