"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AppIcon, ProductMark } from "@/common/components";
import { NAV_ITEMS, PRACTICE_ROUTES } from "@/features/practice/constants";
import { usePractice } from "@/features/practice/PracticeProvider";
import { usePracticeAccessToast } from "@/features/practice/useAccessToast";
import { readReadingSize, type DeviceCheckKind } from "@/features/deviceCheck/device-check";
import { DeviceCheckDialog } from "@/features/deviceCheck/DeviceCheckDialog";
import { useDeviceChecks } from "@/features/deviceCheck/useDeviceChecks";
import { usePracticeStart } from "@/features/practice/mode/usePracticeStart";
import { CommandPalette } from "./CommandPalette";
import { NavIcon, type NavIconName } from "./NavIcon";
import { useTheme } from "@/common/providers/ThemeProvider";
import { useTranslation } from "@/common/i18n";
import type { TranslationKey } from "@/common/i18n";

export function StudentShell({ children }: { children: ReactNode }) {
  usePracticeAccessToast();
  const pathname = usePathname();
  const router = useRouter();
  const { authStatus, signOut } = usePractice();
  const { theme, toggleTheme } = useTheme();
  const { t, locale, setLocale } = useTranslation();
  const { markPassed } = useDeviceChecks();
  const { openFor, dialog: practiceModeDialog } = usePracticeStart();

  const [searchOpen, setSearchOpen] = useState(false);
  const [deviceCheckKind, setDeviceCheckKind] = useState<DeviceCheckKind | null>(null);

  const toggleLocale = () => setLocale(locale === "en" ? "vi" : "en");

  // Global shortcut: ⌘K / Ctrl+K toggles the command palette
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  
  const activeNavItem = NAV_ITEMS.find((item) => item.href === PRACTICE_ROUTES.home
    ? pathname === item.href
    : pathname.startsWith(item.href));

  useEffect(() => {
    if (authStatus === "signed-out") router.replace(PRACTICE_ROUTES.signIn);
  }, [authStatus, router]);

  // The text size the student picked in the reading check applies to every practice page.
  useEffect(() => {
    document.documentElement.dataset.readingSize = readReadingSize();
  }, []);

  if (authStatus === "loading") return <ShellLoading t={t} />;

  if (authStatus === "signed-out") {
    return <ShellLoading t={t} />;
  }

  // The practice session is its own page, like the Pearson practice session: no rail or top bar to wander off to.
  if (pathname === PRACTICE_ROUTES.practiceSession) {
    return <main className="session-page">{children}</main>;
  }

  return (
    <div className="student-shell">
      <aside className="side-rail" aria-label="Student navigation">
        <div className="rail-brand">
          <div className="brand-mark" aria-hidden="true"><ProductMark /></div>
          <div className="rail-brand-text">
            <strong>{t("shell.pearson")}</strong>
            <span className="rail-brand-subtitle">{t("shell.pteOfficialAIPractice")}</span>
          </div>
        </div>

        <nav className="side-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === PRACTICE_ROUTES.home
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                className={`nav-link${isActive ? " nav-link-active" : ""}`}
                href={item.href}
                key={item.href}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="nav-icon" aria-hidden="true"><NavIcon name={item.icon as NavIconName} /></span>
                <span>{t(`nav.${item.icon === "practice" ? "practiceTests" : item.icon}` as TranslationKey)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="rail-spacer" />

        <div className="account-card">
          <div className="account-profile-row">
            <div className="account-avatar-wrap">
              <div className="account-avatar" aria-hidden="true">S</div>
              <span className="account-online-dot" aria-label="Online" />
            </div>
            <div className="account-copy">
              <strong>{t("shell.student")}</strong>
              <span>{t("shell.pearsonPTECore")}</span>
            </div>
          </div>
          <div className="account-actions-row">
            <button className="account-tool-btn" type="button" onClick={toggleLocale} aria-label="Toggle language" title="Toggle language">
              <AppIcon name="translate" size={14} />
              <span>{locale.toUpperCase()}</span>
            </button>
            <button className="account-tool-btn" type="button" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
              <AppIcon name={theme === "dark" ? "sun" : "moon"} size={15} />
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
            <button className="account-tool-btn account-tool-danger" type="button" onClick={signOut} aria-label={t("common.signOut")} title={t("common.signOut")}>
              <AppIcon name="signOut" size={15} />
            </button>
          </div>
        </div>
      </aside>

      <div className="workspace">
        <header className="top-bar">
          <div className="mobile-brand">
            <div className="brand-mark brand-mark-small" aria-hidden="true"><ProductMark /></div>
            <strong>{t("shell.pteOfficialAIPractice")}</strong>
          </div>
          <span className="top-page-title">{activeNavItem ? t(`nav.${activeNavItem.icon === "practice" ? "practiceTests" : activeNavItem.icon}` as TranslationKey) : t("nav.home")}</span>
          <div className="top-bar-spacer" />
          <button
            type="button"
            className="search-pill"
            onClick={() => setSearchOpen(true)}
            aria-label={t("commandPalette.placeholder")}
          >
            <AppIcon name="search" size={20} />
            <span>{t("shell.search")}</span>
            <kbd>⌘ K</kbd>
          </button>
          <div className="top-context" aria-label="Current practice product">
            <span>{t("shell.pearsonPTECore")}</span>
            <AppIcon name="chevronDown" size={17} />
          </div>
        </header>
        <main className="main-content" key={pathname}>{children}</main>
      </div>

      {searchOpen ? (
        <CommandPalette
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onStartTask={openFor}
          onOpenDeviceCheck={(kind) => setDeviceCheckKind(kind)}
        />
      ) : null}
      <DeviceCheckDialog
        kind={deviceCheckKind}
        onClose={() => setDeviceCheckKind(null)}
        onPassed={markPassed}
      />
      {practiceModeDialog}
    </div>
  );
}

function ShellLoading({ t }: { t?: (k: TranslationKey) => string }) {
  return (
    <main className="shell-loading" role="status" aria-live="polite">
      <div className="loading-panel">
        <div className="brand-mark" aria-hidden="true"><ProductMark /></div>
        <span className="loading-dot" aria-hidden="true" />
        {t ? t("common.loadingWorkspace") : "Loading your practice workspace…"}
      </div>
    </main>
  );
}
