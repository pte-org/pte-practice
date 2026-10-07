"use client";

import { AccessStatusBanner } from "@/features/practice/AccessStatusBanner";
import { AppIcon } from "@/features/icons/AppIcon";
import { orderCatalogSections } from "@/features/practice/catalog-order";
import { UI_TEXT } from "@/features/practice/constants";
import { usePractice } from "@/features/practice/PracticeProvider";

export function ProgressView() {
  const { catalog } = usePractice();
  const speaking = orderCatalogSections(catalog.sections).find((section) => section.code === "SPEAKING");
  const taskRows = speaking?.taskTypes.slice(0, 5) ?? [];
  const metrics = [
    { label: "Speaking", icon: "mic" as const },
    { label: "Writing", icon: "writing" as const },
    { label: "Reading", icon: "reading" as const },
    { label: "Listening", icon: "listening" as const },
    { label: "Exam date", icon: "calendar" as const },
    { label: "Responses", icon: "responses" as const },
  ];

  return (
    <div className="page-stack" data-testid="progress-page">
      <AccessStatusBanner />
      <div className="progress-reference">
        <section className="reference-card progress-overview" aria-labelledby="progress-overview-title">
          <div className="progress-overview-header">
            <h1 id="progress-overview-title">Get started, Student 🚀</h1>
            <p>Your practice summary will appear here after your first response.</p>
          </div>
          <div className="metric-grid">
            {metrics.map((metric) => (
              <div className="metric-cell" key={metric.label}>
                <AppIcon name={metric.icon} size={21} />
                <span>{metric.label}</span>
                <strong className="metric-empty">—</strong>
              </div>
            ))}
          </div>
          <div className="insight-strip"><AppIcon name="sparkle" size={20} /><span>{UI_TEXT.progressEmptyDescription}</span></div>
        </section>

        <section className="reference-section" aria-labelledby="progress-speaking-title">
          <h2 id="progress-speaking-title">Speaking</h2>
          <div className="progress-section-card">
            <article className="progress-skill-card">
              <div className="progress-empty-ring" aria-hidden="true">—</div>
              <div><h3>Speaking proficiency</h3><p>Complete a practice task to see your latest result.</p></div>
            </article>
            <div className="skills-list">
              <div className="skill-list-row">
                <span className="skill-list-icon" aria-hidden="true"><AppIcon name="mic" size={19} /></span>
                <span className="skill-list-copy"><strong>Speaking items</strong><span>{taskRows.length || "No"} task types</span></span>
              </div>
              {taskRows.map((task) => (
                <div className="skill-list-row" key={task.code}>
                  <span className="skill-list-icon" aria-hidden="true"><AppIcon name="mic" size={17} /></span>
                  <span className="skill-list-copy"><strong>{task.displayName}</strong><span>No response yet</span></span>
                  <span className="state-badge state-badge-locked">—</span>
                  <span className="skill-list-action" aria-hidden="true"><AppIcon name="chevronRight" size={18} /></span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <p className="quiet-note">Progress is read-only. Historical results will stay available independently of current practice access.</p>
      </div>
    </div>
  );
}
