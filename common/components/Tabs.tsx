"use client";

import { useId, type KeyboardEvent as ReactKeyboardEvent, type ReactElement, type ReactNode } from "react";

/**
 * Ported from `pte-web/packages/ui/src/components/Tabs.tsx` (@pte/ui) with the same props (`Tabs`, `TabPanel`),
 * styled with practice CSS tokens. `ariaLabel` is required here because practice has no shared "Sections" string.
 */
export type TabsVariant = "default" | "minimal";
export type TabsActiveVariant = "surface" | "primary";

export interface TabItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  count?: string | number;
  badge?: string | number;
}

export interface TabsProps {
  items: readonly TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
  ariaLabel: string;
  variant?: TabsVariant;
  activeVariant?: TabsActiveVariant;
}

export const Tabs = ({ items, value, onChange, className, id, ariaLabel, variant = "default", activeVariant = "surface" }: TabsProps): ReactElement => {
  const generatedTabsId = useId().replace(/:/g, "");
  const tabsId = id ?? generatedTabsId;

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, itemId: string): void => {
    const enabled = items.filter((item) => !item.disabled);
    const currentIndex = enabled.findIndex((item) => item.id === itemId);
    if (currentIndex < 0) return;
    const nextIndex = event.key === "ArrowRight" ? (currentIndex + 1) % enabled.length
      : event.key === "ArrowLeft" ? (currentIndex - 1 + enabled.length) % enabled.length
        : event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1 : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    const next = enabled[nextIndex];
    onChange(next.id);
    document.getElementById(`${tabsId}-tab-${next.id}`)?.focus();
  };

  return (
    <div className={`tabs tabs-${variant} tabs-active-${activeVariant}${className ? ` ${className}` : ""}`}>
      <div className="tabs-list" role="tablist" aria-label={ariaLabel}>
        {items.map((item) => {
          const selected = item.id === value;
          const badge = item.badge ?? item.count;
          return (
            <button key={item.id} id={`${tabsId}-tab-${item.id}`} type="button" role="tab" aria-selected={selected}
              aria-controls={`${tabsId}-panel-${item.id}`} tabIndex={selected && !item.disabled ? 0 : -1}
              disabled={item.disabled} className={`tabs-trigger${selected ? " tabs-trigger-selected" : ""}`}
              onClick={() => onChange(item.id)} onKeyDown={(event) => handleKeyDown(event, item.id)}>
              {item.icon}
              {item.label}
              {badge !== undefined ? <span className="tabs-badge">{badge}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export interface TabPanelProps {
  id: string;
  active: boolean;
  children: ReactNode;
  keepMounted?: boolean;
  labelledBy?: string;
  className?: string;
}

export const TabPanel = ({ id, active, children, keepMounted = false, labelledBy, className }: TabPanelProps): ReactElement | null => {
  if (!active && !keepMounted) return null;
  return (
    <div role="tabpanel" id={id} aria-labelledby={labelledBy} aria-hidden={!active || undefined} hidden={!active} className={className}>
      {children}
    </div>
  );
};
