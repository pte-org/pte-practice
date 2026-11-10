import type { ReactElement } from "react";
import "./skeleton.css";

interface SkeletonProps {
  variant?: "line" | "title" | "circle" | "block" | "button";
  className?: string;
}

/** Decorative building block; the containing loading region supplies the accessible label. */
export const Skeleton = ({ variant = "line", className = "" }: SkeletonProps): ReactElement => (
  <span aria-hidden="true" className={`common-skeleton common-skeleton-${variant} ${className}`.trim()} />
);
