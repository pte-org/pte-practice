import Link from "next/link";
import type { ReactElement } from "react";
import { AppIcon, type IconName } from "./AppIcon";

interface ArrowActionProps {
  label: string;
  /** Navigates when given; otherwise the action is a button calling {@link onClick}. */
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  /** Trailing icon; the arrow by default, "retake" (circular arrow) for an action that starts over. */
  icon?: IconName;
}

/** The text-and-arrow action ("Xem tiến trình →", "Xem lại →"): a quiet pill in the action blue, as a link or a button. */
export const ArrowAction = ({ label, href, onClick, disabled = false, className, icon = "arrowRight" }: ArrowActionProps): ReactElement => {
  const classes = `button button-ghost button-pill arrow-action${className ? ` ${className}` : ""}`;
  const content = <>{label}<AppIcon name={icon} size={16} /></>;
  if (href && !disabled) return <Link className={classes} href={href}>{content}</Link>;
  return <button className={classes} type="button" disabled={disabled} onClick={onClick}>{content}</button>;
};
