"use client";

import { useId, useState, type ReactElement, type ReactNode } from "react";
import { AppIcon } from "./AppIcon";

/**
 * Ported from `pte-web/packages/ui/src/components/CollapsibleSection.tsx` (@pte/ui) with the same props, styled with
 * practice CSS tokens. The whole header toggles (an accordion row), shown with a chevron instead of the text button.
 */
interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
  contentClassName?: string;
  /** Practice extension: an icon shown before the title. */
  icon?: ReactNode;
}

export const CollapsibleSection = ({
  title, subtitle, actions, children, collapsible = true, defaultExpanded = true, className, contentClassName, icon,
}: CollapsibleSectionProps): ReactElement => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const sectionId = useId().replace(/:/g, "");
  const titleId = `collapsible-section-title-${sectionId}`;
  const contentId = `collapsible-section-content-${sectionId}`;
  const open = !collapsible || isExpanded;

  return (
    <section aria-labelledby={titleId} className={`collapsible${className ? ` ${className}` : ""}`}>
      <div className="collapsible-head">
        {collapsible ? (
          <button type="button" className="collapsible-toggle" aria-expanded={isExpanded} aria-controls={contentId}
            onClick={() => setIsExpanded((current) => !current)}>
            {icon}
            <span id={titleId}>{title}</span>
            <AppIcon name="chevronDown" size={18} />
          </button>
        ) : (
          <h2 id={titleId} className="collapsible-title">{icon}{title}</h2>
        )}
        {actions}
      </div>
      {subtitle ? <p className="collapsible-subtitle">{subtitle}</p> : null}
      {open ? <div id={contentId} className={contentClassName}>{children}</div> : null}
    </section>
  );
};
