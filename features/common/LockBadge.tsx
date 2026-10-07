import { AppIcon } from "@/features/icons/AppIcon";

export function LockBadge({ locked, label }: { locked: boolean; label: string }) {
  return (
    <span className={`state-badge${locked ? " state-badge-locked" : " state-badge-ready"}`}>
      <AppIcon name={locked ? "lock" : "check"} size={13} />
      {label}
    </span>
  );
}
