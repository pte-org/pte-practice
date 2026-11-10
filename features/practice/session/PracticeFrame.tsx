"use client";

import type { ReactElement, ReactNode } from "react";
import { PracticeBackground } from "../appearance/PracticeBackground";
import { WorkspaceLayout } from "@/common/components/WorkspaceLayout";
import { usePracticeAppearance } from "../appearance/usePracticeAppearance";
import "./practice-studio.css";
import "../appearance/appearance.css";

interface PracticeFrameProps {
  header: ReactNode;
  sidebar: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  loading?: boolean;
  label?: string;
}

/** Shared by every task renderer and its loading state; slots keep delivery logic outside the frame. */
export const PracticeFrame = ({ header, sidebar, footer, children, loading = false, label }: PracticeFrameProps): ReactElement => {
  const appearance = usePracticeAppearance();
  const background = appearance.focus ? "default" : appearance.background;
  return (
    <section className="practice-studio practice-session" data-testid={loading ? "practice-session-loading" : "practice-session"}
      data-background={background} data-background-blur={appearance.blur} data-glass-opacity={appearance.opacity}
      aria-busy={loading} aria-label={label}>
      <PracticeBackground value={appearance} />
      <WorkspaceLayout className="practice-studio-layout" header={<div className="practice-studio-topbar">
        {header}
      </div>} sidebar={sidebar}>
        {children}
        {footer ? <div className="practice-studio-actions">{footer}</div> : null}
      </WorkspaceLayout>
    </section>
  );
};
