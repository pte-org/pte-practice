import type { ReactElement } from "react";
import { Skeleton } from "./Skeleton";

interface LoadingStateProps {
  message: string;
  compact?: boolean;
}

export function LoadingState({ message, compact = false }: LoadingStateProps): ReactElement {
  return (
    <div className={`common-loading-skeleton${compact ? " common-loading-skeleton-compact" : ""}`}
      role="status" aria-label={message}>
      <span className="common-loading-label">{message}</span>
      <Skeleton variant="title" />
      <Skeleton />
      {compact ? <Skeleton /> : (
        <div className="common-loading-skeleton-list">
          {[0, 1, 2].map((index) => (
            <div className="common-loading-skeleton-card" key={index}>
              <Skeleton variant="circle" />
              <div className="common-loading-skeleton-copy"><Skeleton /><Skeleton /></div>
              <Skeleton variant="button" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
