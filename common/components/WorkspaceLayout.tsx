import type { ReactElement, ReactNode } from "react";
import "./workspace-layout.css";

interface WorkspaceLayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  beforeContent?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Domain-neutral slots keep persistent workspace chrome outside the changing route content. */
export const WorkspaceLayout = ({ header, sidebar, beforeContent, children, className }: WorkspaceLayoutProps): ReactElement => (
  <div className={`workspace-layout${className ? ` ${className}` : ""}`}>
    {header}
    <div className="workspace-layout-columns">
      <div className="workspace-layout-main">
        {beforeContent}
        <div className="workspace-layout-content">{children}</div>
      </div>
      <div className="workspace-layout-sidebar">{sidebar}</div>
    </div>
  </div>
);
