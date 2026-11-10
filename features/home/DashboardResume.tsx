"use client";

import Link from "next/link";
import { useRef, useState, type ReactElement } from "react";
import { AppIcon, Button, Tabs } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { orderCatalogSections } from "@/features/practice/catalog-order";
import type { PracticeCatalogSection } from "@/features/practice/contracts";
import { iconForTaskType } from "@/features/practice/icon-mapping";
import { skillKey } from "@/features/practice/presentation";
import { DASHBOARD_COPY, DASHBOARD_RESUME_PREVIEW_ITEMS } from "./constants";
import { selectResumeCards, type Recommendation } from "./recommendations";

interface ResumeItemProps {
  card: Recommendation;
  skill: string;
  featured?: boolean;
}

const ResumeItem = ({ card, skill, featured = false }: ResumeItemProps): ReactElement | null => {
  const { t } = useTranslation();
  if (card.target.type !== "href") return null;
  return (
    <article className={`resume-item${featured ? " resume-item-featured" : ""}`}>
      <span className="dashboard-resume-icon" aria-hidden="true">
        <AppIcon name={iconForTaskType(card.taskCode ?? "")} size={featured ? 26 : 20} />
      </span>
      <div className="resume-item-copy">
        <span className="resume-item-meta">{skill}</span>
        <h3>{card.title}</h3>
        <div className="resume-item-progress">
          <progress className="dashboard-resume-progress" aria-label={card.title}
            value={card.progress.done} max={Math.max(1, card.progress.total)} />
          <span>{card.description}</span>
        </div>
      </div>
      <Link className={`button ${featured ? "button-primary" : "button-outline"}`} href={card.target.href}
        aria-label={`${t("presentation.continue")} · ${card.title}`}>
        {t("presentation.continue")}<AppIcon name="arrowRight" size={16} />
      </Link>
    </article>
  );
};

interface DashboardRecommendationsProps {
  cards: Recommendation[];
  sections: PracticeCatalogSection[];
  state: "loading" | "ready" | "error";
}

export const DashboardRecommendations = ({ cards, sections, state }: DashboardRecommendationsProps): ReactElement | null => {
  const { t, locale } = useTranslation();
  const copy = DASHBOARD_COPY[locale];
  const [display, setDisplay] = useState<"preview" | "expanded" | "collapsed">("preview");
  const expanded = display === "expanded";
  const collapsed = display === "collapsed";
  const [selected, setSelected] = useState("ALL");
  const heading = useRef<HTMLHeadingElement>(null);
  const ordered = orderCatalogSections(sections);
  const groupFor = (card: Recommendation): PracticeCatalogSection | undefined =>
    ordered.find((section) => section.taskTypes.some((task) => task.code === card.taskCode));
  const skillName = (card: Recommendation): string => {
    const group = groupFor(card);
    const key = group ? skillKey(group.code) : null;
    return key ? t(key) : group?.displayName ?? "";
  };
  const visible = selectResumeCards(cards, sections, expanded, selected);
  const items = [{ id: "ALL", label: copy.allTasks, count: cards.length }, ...ordered.map((section) => {
    const key = skillKey(section.code);
    return { id: section.code, label: key ? t(key) : section.displayName,
      count: cards.filter((card) => groupFor(card)?.code === section.code).length };
  })];
  const collapse = (returnToHeading = false): void => {
    setDisplay("collapsed");
    setSelected("ALL");
    if (returnToHeading) {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: "start" });
    }
  };
  if (!cards.length) return null;
  return (
    <section className="dashboard-section dashboard-resume" aria-labelledby="dashboard-next-title" aria-busy={state === "loading"}>
      <div className="dashboard-section-heading dashboard-resume-heading">
        <div className="resume-heading-main">
          <span className="resume-heading-icon" aria-hidden="true"><AppIcon name="bookOpen" size={22} /></span>
          <div className="resume-heading-copy">
            <div className="resume-heading-title"><h2 id="dashboard-next-title" ref={heading} tabIndex={-1}>{copy.next}</h2>
              <span className="resume-count">{cards.length}</span></div>
            <p>{copy.nextHint}</p>
          </div>
        </div>
        {cards.length > DASHBOARD_RESUME_PREVIEW_ITEMS || expanded || collapsed ? <Button variant="secondary" size="sm" className="resume-toggle"
          rightIcon={<AppIcon name="chevronDown" size={18} />} aria-expanded={expanded}
          aria-controls="dashboard-resume-content" onClick={() => expanded ? collapse() : setDisplay("expanded")}>
          {expanded ? copy.resumeCollapse : copy.resumeAll}
        </Button> : null}
      </div>
      <div id="dashboard-resume-content" className="resume-content" hidden={collapsed}>
        {!collapsed ? <>
        {expanded ? <Tabs id="dashboard-resume" items={items} value={selected} onChange={setSelected}
          ariaLabel={copy.next} variant="minimal" /> : <ResumeItem card={cards[0]} skill={skillName(cards[0])} featured />}
        <div className="resume-list" role={expanded ? "tabpanel" : undefined}
          id={expanded ? `dashboard-resume-panel-${selected}` : undefined}
          aria-labelledby={expanded ? `dashboard-resume-tab-${selected}` : undefined}>
          {visible.map((card) => <ResumeItem key={card.id} card={card} skill={skillName(card)} />)}
          {expanded && !visible.length ? <p className="resume-filter-empty" role="status">{copy.resumeFilterEmpty}</p> : null}
        </div>
        </> : null}
      </div>
    </section>
  );
};
