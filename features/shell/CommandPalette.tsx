"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { AppIcon, type IconName } from "@/common/components";
import { useTranslation, type TranslationKey } from "@/common/i18n";
import { useTheme } from "@/common/providers/ThemeProvider";
import { useToast } from "@/common/components/Toast";
import type { DeviceCheckKind } from "@/features/deviceCheck/device-check";
import { iconForTaskType } from "@/features/practice/icon-mapping";
import { PRACTICE_ROUTES, PREVIEW_TASKS, TARGET_PRACTICE_SECTIONS } from "@/features/practice/constants";
import type { PracticeCatalogTask } from "@/features/practice/contracts";
import { flattenCatalogTasks } from "@/features/practice/catalog-order";
import { usePractice } from "@/features/practice/PracticeProvider";
import { taskDisplayName } from "@/features/practice/presentation";

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onStartTask?: (task: PracticeCatalogTask) => void;
  onOpenDeviceCheck?: (kind: DeviceCheckKind) => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  section: "navigation" | "skills" | "tasks" | "quickActions";
  icon: IconName;
  keywords?: string[];
  onSelect: () => void;
}

function removeAccents(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

export function CommandPalette({
  open,
  onClose,
  onStartTask,
  onOpenDeviceCheck,
}: CommandPaletteProps) {
  const router = useRouter();
  const { catalog } = usePractice();
  const { t, locale, setLocale } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  const catalogTasks = useMemo(() => flattenCatalogTasks(catalog.sections), [catalog.sections]);

  // Focus input and lock body scroll when mounted
  useEffect(() => {
    inputRef.current?.focus();
    document.body.classList.add("modal-open");
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, []);

  // Build commands
  const allItems: CommandItem[] = useMemo(() => {
    const navItems: CommandItem[] = [
      {
        id: "nav-home",
        title: t("nav.home"),
        subtitle: "/",
        section: "navigation",
        icon: "home",
        keywords: ["trang chu", "home", "dashboard"],
        onSelect: () => {
          router.push(PRACTICE_ROUTES.home);
          onClose();
        },
      },
      {
        id: "nav-practice-tests",
        title: t("nav.practiceTests"),
        subtitle: "/practice-tests",
        section: "navigation",
        icon: "practice",
        keywords: ["bai thi thu", "luyen de", "mock test", "exam"],
        onSelect: () => {
          router.push(PRACTICE_ROUTES.practiceTests);
          onClose();
        },
      },
      {
        id: "nav-study-pack",
        title: t("nav.studyPack"),
        subtitle: "/study-pack",
        section: "navigation",
        icon: "studyPack",
        keywords: ["study pack", "goi hoc tap", "skills"],
        onSelect: () => {
          router.push(PRACTICE_ROUTES.studyPack);
          onClose();
        },
      },
      {
        id: "nav-progress",
        title: t("nav.progress"),
        subtitle: "/progress",
        section: "navigation",
        icon: "progress",
        keywords: ["tien do", "progress", "lich su", "history", "analytics"],
        onSelect: () => {
          router.push(PRACTICE_ROUTES.progress);
          onClose();
        },
      },
      {
        id: "nav-leaderboard",
        title: t("commandPalette.leaderboard"),
        subtitle: t("commandPalette.featureComingSoon"),
        section: "navigation",
        icon: "trophy",
        keywords: ["xep hang", "leaderboard", "rank", "top"],
        onSelect: () => {
          showToast(t("commandPalette.featureComingSoon"), { tone: "info" });
          onClose();
        },
      },
      {
        id: "nav-redeem",
        title: t("commandPalette.redeem"),
        subtitle: t("commandPalette.featureComingSoon"),
        section: "navigation",
        icon: "gift",
        keywords: ["doi ma", "redeem", "code", "voucher", "gift"],
        onSelect: () => {
          showToast(t("commandPalette.featureComingSoon"), { tone: "info" });
          onClose();
        },
      },
    ];

    const skillItems: CommandItem[] = TARGET_PRACTICE_SECTIONS.map((section) => {
      const skillName = t(`skills.${section.code.toLowerCase()}` as TranslationKey);
      const icon = section.code === "SPEAKING" ? "mic" : section.code === "WRITING" ? "writing" : section.code === "READING" ? "reading" : "listening";
      return {
        id: `skill-${section.code}`,
        title: skillName,
        subtitle: `${section.taskCodes.length} ${t("home.skillReadyLabel")}`,
        section: "skills",
        icon,
        keywords: [section.code, section.displayName, skillName],
        onSelect: () => {
          router.push(PRACTICE_ROUTES.studyPack);
          onClose();
        },
      };
    });

    const taskItems: CommandItem[] = PREVIEW_TASKS.map((task) => {
      const actualTask = catalogTasks.find((t) => t.code === task.code);
      const displayName = actualTask?.displayName ?? task.displayName;
      const localizedTitle = taskDisplayName(task.code, displayName, t);
      const skillLabel = t(`skills.${task.section.toLowerCase()}` as TranslationKey);
      return {
        id: `task-${task.code}`,
        title: localizedTitle,
        subtitle: skillLabel,
        section: "tasks",
        icon: iconForTaskType(task.code),
        keywords: [task.code, displayName, localizedTitle, task.section],
        onSelect: () => {
          onClose();
          if (actualTask && onStartTask) {
            onStartTask(actualTask);
          } else {
            router.push(PRACTICE_ROUTES.home);
          }
        },
      };
    });

    const actionItems: CommandItem[] = [
      {
        id: "action-theme",
        title: t("commandPalette.toggleTheme"),
        subtitle: theme === "dark" ? "Dark ➔ Light" : "Light ➔ Dark",
        section: "quickActions",
        icon: theme === "dark" ? "sun" : "moon",
        keywords: ["doi giao dien", "dark mode", "light mode", "theme", "sang toi"],
        onSelect: () => {
          toggleTheme();
          onClose();
        },
      },
      {
        id: "action-language",
        title: t("commandPalette.toggleLanguage"),
        subtitle: locale === "vi" ? "VI ➔ EN" : "EN ➔ VI",
        section: "quickActions",
        icon: "translate",
        keywords: ["doi ngon ngu", "language", "tieng viet", "english", "locale"],
        onSelect: () => {
          setLocale(locale === "en" ? "vi" : "en");
          onClose();
        },
      },
      {
        id: "action-check-mic",
        title: t("commandPalette.checkMic"),
        section: "quickActions",
        icon: "mic",
        keywords: ["kiem tra mic", "microphone", "sound test"],
        onSelect: () => {
          onClose();
          onOpenDeviceCheck?.("mic");
        },
      },
      {
        id: "action-check-speaker",
        title: t("commandPalette.checkSpeaker"),
        section: "quickActions",
        icon: "listening",
        keywords: ["kiem tra loa", "speaker", "audio test", "tai nghe"],
        onSelect: () => {
          onClose();
          onOpenDeviceCheck?.("speaker");
        },
      },
      {
        id: "action-check-keyboard",
        title: t("commandPalette.checkKeyboard"),
        section: "quickActions",
        icon: "fillTypeIn",
        keywords: ["kiem tra ban phim", "keyboard test"],
        onSelect: () => {
          onClose();
          onOpenDeviceCheck?.("keyboard");
        },
      },
      {
        id: "action-check-reading",
        title: t("commandPalette.checkReading"),
        section: "quickActions",
        icon: "reading",
        keywords: ["co chu khi doc", "font size", "reading size"],
        onSelect: () => {
          onClose();
          onOpenDeviceCheck?.("reading");
        },
      },
    ];

    return [...navItems, ...skillItems, ...taskItems, ...actionItems];
  }, [catalogTasks, locale, onClose, onOpenDeviceCheck, onStartTask, router, setLocale, showToast, t, theme, toggleTheme]);

  // Filter items
  const filteredItems = useMemo(() => {
    const q = removeAccents(query.trim());
    if (!q) {
      // Default view when input is empty: show Navigation and Quick Actions
      return allItems.filter((item) => item.section === "navigation" || item.section === "quickActions");
    }
    return allItems.filter((item) => {
      const matchTitle = removeAccents(item.title).includes(q);
      const matchSub = item.subtitle ? removeAccents(item.subtitle).includes(q) : false;
      const matchKeywords = item.keywords?.some((k) => removeAccents(k).includes(q)) ?? false;
      return matchTitle || matchSub || matchKeywords;
    });
  }, [allItems, query]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredItems.length ? (prev + 1) % filteredItems.length : 0));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredItems.length ? (prev - 1 + filteredItems.length) % filteredItems.length : 0,
        );
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].onSelect();
        }
      }
    },
    [filteredItems, onClose, selectedIndex],
  );

  // Global Escape key listener
  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onGlobalKeyDown);
    return () => window.removeEventListener("keydown", onGlobalKeyDown);
  }, [onClose]);

  // Auto scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>("[data-selected='true']");
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!open) return null;

  // Group filtered items by section
  const sections: Array<{ key: "navigation" | "skills" | "tasks" | "quickActions"; label: string; items: CommandItem[] }> = [
    { key: "navigation", label: t("commandPalette.navigation"), items: [] },
    { key: "skills", label: t("commandPalette.skills"), items: [] },
    { key: "tasks", label: t("commandPalette.tasks"), items: [] },
    { key: "quickActions", label: t("commandPalette.quickActions"), items: [] },
  ];

  filteredItems.forEach((item) => {
    const sec = sections.find((s) => s.key === item.section);
    sec?.items.push(item);
  });

  const activeSections = sections.filter((s) => s.items.length > 0);

  // Global index mapping
  let currentIndexTracker = 0;

  return (
    <div
      className="command-palette-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="command-palette-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={t("commandPalette.placeholder")}
        onKeyDown={handleKeyDown}
      >
        <div className="command-palette-header">
          <span className="command-palette-search-icon" aria-hidden="true">
            <AppIcon name="search" size={20} />
          </span>
          <input
            ref={inputRef}
            id={inputId}
            className="command-palette-input"
            type="text"
            value={query}
            placeholder={t("commandPalette.placeholder")}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          {query ? (
            <button
              type="button"
              className="command-palette-clear-btn"
              onClick={() => {
                setQuery("");
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              aria-label="Clear query"
            >
              <AppIcon name="close" size={16} />
            </button>
          ) : (
            <kbd className="command-palette-esc-badge" onClick={onClose}>
              ESC
            </kbd>
          )}
        </div>

        <div className="command-palette-list" ref={listRef} role="listbox">
          {activeSections.length === 0 ? (
            <div className="command-palette-empty">
              <AppIcon name="search" size={28} />
              <p>{t("commandPalette.noResults")}</p>
            </div>
          ) : (
            activeSections.map((sec) => (
              <div key={sec.key} className="command-palette-group">
                <div className="command-palette-group-title">{sec.label}</div>
                {sec.items.map((item) => {
                  const itemIndex = currentIndexTracker++;
                  const isSelected = itemIndex === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      role="option"
                      aria-selected={isSelected}
                      data-selected={isSelected ? "true" : undefined}
                      className={`command-palette-item ${isSelected ? "command-palette-item-selected" : ""}`}
                      onClick={item.onSelect}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                    >
                      <span className="command-palette-item-icon" aria-hidden="true">
                        <AppIcon name={item.icon} size={18} />
                      </span>
                      <span className="command-palette-item-title">{item.title}</span>
                      {item.subtitle ? (
                        <span className="command-palette-item-subtitle">{item.subtitle}</span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="command-palette-footer">
          <div className="command-palette-footer-hint">
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            <span>{t("commandPalette.hintNavigate")}</span>
          </div>
          <div className="command-palette-footer-hint">
            <kbd>↵</kbd>
            <span>{t("commandPalette.hintSelect")}</span>
          </div>
          <div className="command-palette-footer-hint">
            <kbd>ESC</kbd>
            <span>{t("commandPalette.hintClose")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
