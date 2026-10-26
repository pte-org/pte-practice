"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AppIcon, ProgressRing } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { formatEstimatedDuration } from "@/features/mockTests/mock-test-row";
import type { Recommendation } from "./recommendations";
import {
  CAROUSEL_ANIMATION_DURATION_MS,
  CAROUSEL_DEFAULT_CARD_WIDTH,
  CAROUSEL_DRAG_THRESHOLD_PX,
  CAROUSEL_GAP,
  CAROUSEL_SNAP_RESTORE_DELAY_MS,
} from "./constants";

interface RecommendationCarouselProps {
  cards: Recommendation[];
  title?: ReactNode;
  /** Starts a mock test that has no attempt yet (opens the timed / untimed choice). */
  onStartMock: (publicId: string, title: string) => void;
}

/** "Recommended for you": a row of cards that scrolls sideways, with circular navigation arrows and drag-to-scroll. */
export function RecommendationCarousel({ title, cards, onStartMock }: RecommendationCarouselProps) {
  const { t } = useTranslation();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  const checkScrollability = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    checkScrollability();

    let rafId: number | null = null;
    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        checkScrollability();
        rafId = null;
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        checkScrollability();
      });
      resizeObserver.observe(el);
      if (el.firstElementChild) {
        resizeObserver.observe(el.firstElementChild);
      }
    }

    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        if (carouselRef.current) {
          carouselRef.current.style.scrollSnapType = "";
          carouselRef.current.style.scrollBehavior = "";
          carouselRef.current.classList.remove("is-dragging");
        }
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      resizeObserver?.disconnect();
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [checkScrollability, cards.length]);

  const [activeButton, setActiveButton] = useState<"left" | "right" | null>(null);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);

  const scroll = (direction: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;

    setActiveButton(direction);
    setSlideDirection(direction);
    setTimeout(() => {
      setActiveButton(null);
      setSlideDirection(null);
    }, CAROUSEL_ANIMATION_DURATION_MS);

    const firstChild = el.firstElementChild as HTMLElement | null;
    const cardWidth = firstChild ? firstChild.offsetWidth : CAROUSEL_DEFAULT_CARD_WIDTH;
    const gap = CAROUSEL_GAP;
    const step = cardWidth + gap;

    const targetLeft = direction === "left"
      ? Math.max(0, el.scrollLeft - step)
      : Math.min(el.scrollWidth - el.clientWidth, el.scrollLeft + step);

    // Disable snap during smooth transition for silky glide
    el.style.scrollSnapType = "none";
    el.scrollTo({
      left: targetLeft,
      behavior: "smooth",
    });

    setTimeout(() => {
      if (el) el.style.scrollSnapType = "x mandatory";
      checkScrollability();
    }, CAROUSEL_SNAP_RESTORE_DELAY_MS);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = carouselRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX;
    startScrollLeftRef.current = el.scrollLeft;
    el.style.scrollSnapType = "none";
    el.style.scrollBehavior = "auto";
    el.classList.add("is-dragging");
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const el = carouselRef.current;
    if (!el) return;
    const deltaX = e.pageX - startXRef.current;
    if (Math.abs(deltaX) > CAROUSEL_DRAG_THRESHOLD_PX) {
      hasMovedRef.current = true;
    }
    el.scrollLeft = startScrollLeftRef.current - deltaX;
  };

  const handleMouseUpOrLeave = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const el = carouselRef.current;
    if (el) {
      el.style.scrollSnapType = "";
      el.style.scrollBehavior = "";
      el.classList.remove("is-dragging");
    }
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      hasMovedRef.current = false;
    }
  };

  return (
    <div className="carousel-wrapper">
      {title ? (
        <div className="section-heading-row">
          {title}
          <div className="carousel-nav-buttons" role="group" aria-label="Carousel navigation">
            <button
              type="button"
              className={`carousel-nav-btn carousel-nav-btn-prev${activeButton === "left" ? " carousel-nav-btn-pressed" : ""}`}
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              aria-label={t("presentation.previous")}
              title={t("presentation.previous")}
            >
              <AppIcon name="chevronLeft" size={20} />
            </button>
            <button
              type="button"
              className={`carousel-nav-btn carousel-nav-btn-next${activeButton === "right" ? " carousel-nav-btn-pressed" : ""}`}
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              aria-label={t("presentation.next")}
              title={t("presentation.next")}
            >
              <AppIcon name="chevronRight" size={20} />
            </button>
          </div>
        </div>
      ) : null}
      <div
        ref={carouselRef}
        className={`carousel${slideDirection ? ` carousel-sliding-${slideDirection}` : ""}`}
        role="list"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onClickCapture={handleClickCapture}
      >
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
    </div>
  );
}
